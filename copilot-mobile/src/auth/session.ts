import {
  clearSession as clearStoredSession,
  getSession,
  saveSession,
  type UserSession,
} from '@/lib/auth';

export type SessionTokens = UserSession;

export async function clearSession(): Promise<void> {
  await clearStoredSession();
}

export async function readSession(): Promise<SessionTokens | null> {
  return getSession();
}

export async function persistSession(session: SessionTokens): Promise<void> {
  await saveSession(session);
}
