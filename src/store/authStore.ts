import { create } from 'zustand';
import { AnyUserProfile, CustomerUser, UserRole } from '../api/types';
import {
  clearStoredToken,
  getApiQueryClient,
  setOnUnauthorizedListener,
  ApiError,
} from '../api/client';
import {
  clearSession,
  getSession,
  setSession,
  UserSession,
} from '../api/session';
import { getMeByRole, logoutByRole } from '../api/auth';

export interface AuthInitResult {
  isValid: boolean;
  role: UserRole | null;
  error?: 'network' | 'unauthorized' | 'unknown';
}

export interface AuthState {
  role: UserRole | null;
  user: AnyUserProfile | null;
  token: string | null;
  isLoading: boolean;
  isGuest: boolean;
  isInitialized: boolean;

  // Actions
  setAuth: (token: string, user: CustomerUser) => Promise<void>;
  setSessionAuth: (role: UserRole, token: string, user: AnyUserProfile) => Promise<void>;
  setUser: (user: AnyUserProfile | null) => void;
  setGuest: (guest: boolean) => void;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
  initAuth: () => Promise<AuthInitResult>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  role: null,
  user: null,
  token: null,
  isLoading: true,
  isGuest: false,
  isInitialized: false,

  // Backwards-compatible customer setAuth
  setAuth: async (token: string, user: CustomerUser) => {
    await setSession({ role: 'customer', token });
    set({
      role: 'customer',
      token,
      user,
      isGuest: false,
      isLoading: false,
    });
  },

  // Multi-role session auth
  setSessionAuth: async (role: UserRole, token: string, user: AnyUserProfile) => {
    await setSession({ role, token });
    set({
      role,
      token,
      user,
      isGuest: false,
      isLoading: false,
    });
  },

  setUser: (user: AnyUserProfile | null) => {
    set({ user });
  },

  setGuest: (guest: boolean) => {
    set({ isGuest: guest, isLoading: false });
  },

  logout: async () => {
    const currentRole = get().role;
    set({ isLoading: true });

    if (currentRole) {
      try {
        await logoutByRole(currentRole);
      } catch {
        // Even if network or API call fails, continue clearing session and cache
      }
    }

    await clearSession();
    const queryClient = getApiQueryClient();
    if (queryClient) {
      queryClient.clear();
    }

    set({
      role: null,
      user: null,
      token: null,
      isGuest: false,
      isLoading: false,
    });
  },

  clearAuth: async () => {
    await clearSession();
    const queryClient = getApiQueryClient();
    if (queryClient) {
      queryClient.clear();
    }
    set({
      role: null,
      user: null,
      token: null,
      isLoading: false,
      isGuest: false,
    });
  },

  initAuth: async (): Promise<AuthInitResult> => {
    set({ isLoading: true });
    let session: UserSession | null = null;
    try {
      session = await getSession();
      if (!session) {
        set({
          role: null,
          user: null,
          token: null,
          isLoading: false,
          isInitialized: true,
        });
        return { isValid: false, role: null };
      }

      set({ token: session.token, role: session.role });
      const response = await getMeByRole(session.role);

      set({
        user: response.data,
        isLoading: false,
        isInitialized: true,
      });

      return { isValid: true, role: session.role };
    } catch (err: unknown) {
      const isNetworkError =
        Boolean(session?.token) &&
        ((err instanceof ApiError && (err.status === 0 || err.code === 'NETWORK_ERROR' || err.status === 408)) ||
          (err instanceof Error && (err.name === 'AbortError' || err.message?.toLowerCase().includes('network'))));

      if (isNetworkError && session) {
        set({
          role: session.role,
          token: session.token,
          isLoading: false,
          isInitialized: true,
        });
        return { isValid: false, role: session.role, error: 'network' };
      }

      // 401 or invalid session: clear session as before
      await clearSession();
      const queryClient = getApiQueryClient();
      if (queryClient) {
        queryClient.clear();
      }

      set({
        role: null,
        user: null,
        token: null,
        isLoading: false,
        isInitialized: true,
      });

      return { isValid: false, role: null, error: 'unauthorized' };
    }
  },
}));

// Wire up client 401 listener to authStore.clearAuth
setOnUnauthorizedListener(() => {
  useAuthStore.getState().clearAuth();
});
