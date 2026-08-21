import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { jwtDecode } from 'jwt-decode';

type IdTokenClaims = {
	name?: string;
	email?: string;
	preferred_username?: string;
	upn?: string;
	oid?: string;
	sub?: string;
	exp?: number;
};

export type UserSession = {
	name: string;
	email: string;
	userId: string;
	idToken: string;
	expiresAt?: number;
};

const SESSION_KEY = 'mentor_session_v1';

function authLog(message: string, data?: Record<string, unknown>) {
	if (typeof __DEV__ !== 'undefined' && __DEV__) {
		if (data) {
			console.info(`[Auth] ${message}`, data);
		} else {
			console.info(`[Auth] ${message}`);
		}
	}
}

function getExpoHostIp(): string | null {
	const hostUri =
		(Constants.expoConfig as { hostUri?: string } | null)?.hostUri ||
		(Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2?.extra?.expoClient?.hostUri ||
		null;

	if (!hostUri) return null;

	const host = hostUri.split(':')[0]?.trim();
	if (!host || host === 'localhost' || host === '127.0.0.1') return null;

	return host;
}

function mapApiUrlForRuntime(rawUrl: string): string {
	let parsed: URL;
	try {
		parsed = new URL(rawUrl);
	} catch {
		return rawUrl;
	}

	const isExpoGo = Constants.appOwnership === 'expo';
	const expoHostIp = isExpoGo ? getExpoHostIp() : null;

	// Android emulator: localhost on host machine is exposed as 10.0.2.2.
	if (Platform.OS === 'android' && parsed.hostname === 'localhost') {
		parsed.hostname = '10.0.2.2';
		return parsed.toString();
	}

	// iOS simulator / desktop environments cannot reach 10.0.2.2.
	if (Platform.OS !== 'android' && parsed.hostname === '10.0.2.2') {
		parsed.hostname = 'localhost';
		return parsed.toString();
	}

	// Physical device on Expo Go: route API calls to your machine LAN IP.
	if (expoHostIp && (parsed.hostname === '10.0.2.2' || parsed.hostname === 'localhost')) {
		parsed.hostname = expoHostIp;
		return parsed.toString();
	}

	return parsed.toString();
}

function decodeSession(idToken: string): UserSession {
	const claims = jwtDecode<IdTokenClaims>(idToken);
	const email = claims.preferred_username || claims.email || claims.upn;
	const name = claims.name || email || 'User';
	const userId = claims.oid || claims.sub || email || 'unknown';

	if (!email) {
		throw new Error('Unable to read user email from Microsoft token.');
	}

	return {
		name,
		email,
		userId,
		idToken,
		expiresAt: claims.exp ? claims.exp * 1000 : undefined,
	};
}

export function getApiUrl(): string {
	const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
	if (envUrl) {
		return mapApiUrlForRuntime(envUrl);
	}

	const fallbackUrl =
		Platform.OS === 'android'
			? 'http://10.0.2.2/mentor-app/copilot-api/chat.php'
			: 'http://localhost/mentor-app/copilot-api/chat.php';

	return mapApiUrlForRuntime(fallbackUrl);
}

export async function saveSession(session: UserSession): Promise<void> {
	try {
		await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
		authLog('Session saved', {
			email: session.email,
			expiresAt: session.expiresAt ?? null,
		});
	} catch {
		// Avoid hard crash if storage native module is unavailable in current runtime.
		authLog('Failed to save session');
	}
}

export async function getSession(): Promise<UserSession | null> {
	let raw: string | null = null;

	try {
		raw = await AsyncStorage.getItem(SESSION_KEY);
	} catch {
		return null;
	}

	if (!raw) return null;
	let parsed: UserSession;
	try {
		parsed = JSON.parse(raw) as UserSession;
	} catch {
		await clearSession();
		return null;
	}

	// Security hardening: reject any stale dev/bypass or malformed token sessions.
	if (!parsed?.idToken || parsed.idToken.split('.').length !== 3) {
		authLog('Invalid stored session token format; clearing session');
		await clearSession();
		return null;
	}

	let tokenSession: UserSession;
	try {
		tokenSession = decodeSession(parsed.idToken);
	} catch {
		authLog('Stored session token failed validation; clearing session');
		await clearSession();
		return null;
	}

	// Keep cached expiry consistent with token claims when available.
	parsed = {
		...parsed,
		name: tokenSession.name,
		email: tokenSession.email,
		userId: tokenSession.userId,
		expiresAt: tokenSession.expiresAt ?? parsed.expiresAt,
	};

	if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
		authLog('Session expired, clearing', { email: parsed.email });
		await clearSession();
		return null;
	}

	authLog('Active session found', { email: parsed.email });

	return parsed;
}

export async function clearSession(): Promise<void> {
	try {
		await AsyncStorage.removeItem(SESSION_KEY);
		authLog('Session cleared');
	} catch {
		// No-op if storage is unavailable.
		authLog('Failed to clear session');
	}
}

export async function signInWithMicrosoft(): Promise<UserSession> {
	const clientId = process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID?.trim();
	const tenantId = process.env.EXPO_PUBLIC_ENTRA_TENANT_ID?.trim();

	if (!clientId || !tenantId) {
		authLog('Sign-in blocked: missing Entra env values');
		throw new Error('Missing EXPO_PUBLIC_ENTRA_CLIENT_ID or EXPO_PUBLIC_ENTRA_TENANT_ID.');
	}

	authLog('Sign-in started', { tenantId });

	const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
	const discovery: AuthSession.DiscoveryDocument = {
		authorizationEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
		tokenEndpoint,
	};

	const isExpoGo = Constants.appOwnership === 'expo';
	const redirectUri = AuthSession.makeRedirectUri(
		isExpoGo
			? { path: 'auth/callback' }
			: {
					scheme: 'copilotmobile',
					path: 'auth/callback',
				}
	);

	const request = new AuthSession.AuthRequest({
		clientId,
		responseType: AuthSession.ResponseType.Code,
		redirectUri,
		usePKCE: true,
		scopes: ['openid', 'profile', 'email', 'offline_access'],
		extraParams: {
			prompt: 'select_account',
		},
	});

	await request.makeAuthUrlAsync(discovery);
	const authResult = await request.promptAsync(discovery);
	authLog('Auth prompt finished', { type: authResult.type });

	if (authResult.type !== 'success' || !authResult.params.code || !request.codeVerifier) {
		authLog('Sign-in failed or cancelled');
		throw new Error('Microsoft sign-in was cancelled or failed.');
	}

	const tokenResponse = await fetch(tokenEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: clientId,
			grant_type: 'authorization_code',
			code: String(authResult.params.code),
			redirect_uri: redirectUri,
			code_verifier: request.codeVerifier,
		}).toString(),
	});

	if (!tokenResponse.ok) {
		authLog('Token exchange failed', { status: tokenResponse.status });
		throw new Error('Failed to exchange authorization code for tokens.');
	}

	const tokenJson = (await tokenResponse.json()) as { id_token?: string };
	if (!tokenJson.id_token) {
		authLog('Token exchange succeeded but id_token missing');
		throw new Error('Missing id_token from Microsoft token endpoint.');
	}

	const session = decodeSession(tokenJson.id_token);
	await saveSession(session);
	authLog('Sign-in success', { email: session.email });
	return session;
}
