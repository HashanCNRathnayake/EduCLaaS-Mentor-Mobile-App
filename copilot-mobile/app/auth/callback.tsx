import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

import { getSession } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
	const router = useRouter();

	useEffect(() => {
		let cancelled = false;

		const routeAfterAuth = async () => {
			const session = await getSession();
			if (cancelled) return;

			if (session) {
				router.replace('/(tabs)');
				return;
			}

			router.replace('/login');
		};

		routeAfterAuth();

		return () => {
			cancelled = true;
		};
	}, [router]);

	return (
		<View style={styles.container}>
			<ActivityIndicator size="large" color="#193e6b" />
			<Text style={styles.text}>Completing sign in...</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff',
	},
	text: {
		marginTop: 12,
		color: '#17314f',
		fontSize: 16,
	},
});
