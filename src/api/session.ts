import * as SecureStore from 'expo-secure-store';

export type UserRole = 'customer' | 'seller' | 'rider' | 'admin';

export interface UserSession {
  role: UserRole;
  token: string;
}

export const SESSION_STORAGE_KEY = 'bakala_user_session';
export const LEGACY_AUTH_TOKEN_KEY = 'bakala_customer_auth_token';

const VALID_ROLES: ReadonlyArray<UserRole> = ['customer', 'seller', 'rider', 'admin'];

export function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole);
}

/**
 * Retrieve the current active session from Expo SecureStore.
 * Returns null if no session exists or if the stored session is corrupt.
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
    if (!raw) {
      // Check legacy customer token if present
      const legacyToken = await SecureStore.getItemAsync(LEGACY_AUTH_TOKEN_KEY);
      if (legacyToken && legacyToken.trim()) {
        const legacySession: UserSession = { role: 'customer', token: legacyToken.trim() };
        await setSession(legacySession);
        try {
          await SecureStore.deleteItemAsync(LEGACY_AUTH_TOKEN_KEY);
        } catch {
          // Ignore legacy cleanup errors
        }
        return legacySession;
      }
      return null;
    }

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      isValidRole(parsed.role) &&
      typeof parsed.token === 'string' &&
      parsed.token.trim().length > 0
    ) {
      return {
        role: parsed.role,
        token: parsed.token.trim(),
      };
    }

    // Stored session payload is corrupt or unknown role; clean up
    await clearSession();
    return null;
  } catch {
    await clearSession();
    return null;
  }
}

/**
 * Store user session securely in Expo SecureStore.
 * Enforces one active session at a time.
 */
export async function setSession(session: UserSession): Promise<void> {
  if (!isValidRole(session.role)) {
    throw new Error(`Cannot store session with invalid role: ${String(session.role)}`);
  }
  if (!session.token || !session.token.trim()) {
    throw new Error('Cannot store session with empty token');
  }

  const payload = JSON.stringify({
    role: session.role,
    token: session.token.trim(),
  });

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, payload);
}

/**
 * Clear the current user session from Expo SecureStore.
 */
export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
  } catch {
    // Ignore deletion errors
  }
  try {
    await SecureStore.deleteItemAsync(LEGACY_AUTH_TOKEN_KEY);
  } catch {
    // Ignore legacy cleanup errors
  }
}
