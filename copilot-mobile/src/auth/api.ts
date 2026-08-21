import { getSession, type UserSession } from '@/lib/auth';

export type SessionTokens = UserSession;

export async function ensureValidSession(): Promise<SessionTokens | null> {
  return getSession();
}
