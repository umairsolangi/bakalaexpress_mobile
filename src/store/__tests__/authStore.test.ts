import { useAuthStore } from '../authStore';
import { getStoredToken, clearStoredToken, setApiQueryClient } from '../../api/client';
import { getSession } from '../../api/session';
import { CustomerUser, SellerProfile } from '../../api/types';
import * as authApi from '../../api/auth';
import { QueryClient } from '@tanstack/react-query';

describe('Auth Store', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    setApiQueryClient(queryClient);
    await clearStoredToken();
    useAuthStore.setState({
      role: null,
      user: null,
      token: null,
      isLoading: false,
      isGuest: false,
      isInitialized: false,
    });
    jest.clearAllMocks();
  });

  it('saves token and customer session to SecureStore on setAuth', async () => {
    const mockUser: CustomerUser = {
      id: 1,
      name: 'Ahmed',
      email: 'ahmed@example.com',
      role: 'customer',
    };

    await useAuthStore.getState().setAuth('test_token_abc', mockUser);

    const state = useAuthStore.getState();
    expect(state.role).toBe('customer');
    expect(state.token).toBe('test_token_abc');
    expect(state.user).toEqual(mockUser);
    expect(state.isGuest).toBe(false);

    const session = await getSession();
    expect(session).toEqual({ role: 'customer', token: 'test_token_abc' });
  });

  it('saves seller session on setSessionAuth', async () => {
    const mockSeller: SellerProfile = {
      id: 5,
      name: 'Al-Madina Store',
      email: 'seller@example.com',
      accountIsApproved: 1,
      is_open: true,
    };

    await useAuthStore.getState().setSessionAuth('seller', 'seller_token_xyz', mockSeller);

    const state = useAuthStore.getState();
    expect(state.role).toBe('seller');
    expect(state.token).toBe('seller_token_xyz');
    expect(state.user).toEqual(mockSeller);

    const session = await getSession();
    expect(session).toEqual({ role: 'seller', token: 'seller_token_xyz' });
  });

  it('clears token and resets user on clearAuth', async () => {
    const mockUser: CustomerUser = {
      id: 1,
      name: 'Ahmed',
      email: 'ahmed@example.com',
      role: 'customer',
    };

    await useAuthStore.getState().setAuth('token_to_clear', mockUser);
    await useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.role).toBeNull();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();

    const session = await getSession();
    expect(session).toBeNull();
  });

  it('clears session and TanStack cache on logout even when the API call fails', async () => {
    // Spy on logoutByRole and mock an error (e.g. 500 or network offline)
    const logoutSpy = jest
      .spyOn(authApi, 'logoutByRole')
      .mockRejectedValueOnce(new Error('Network failure during logout'));
    const clearQueryCacheSpy = jest.spyOn(queryClient, 'clear');

    await useAuthStore.getState().setSessionAuth('rider', 'rider_token_999', {
      id: 9,
      name: 'Rider Tariq',
      email: 'tariq@example.com',
    });

    // Execute logout
    await useAuthStore.getState().logout();

    expect(logoutSpy).toHaveBeenCalledWith('rider');
    expect(clearQueryCacheSpy).toHaveBeenCalled();

    const state = useAuthStore.getState();
    expect(state.role).toBeNull();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();

    const session = await getSession();
    expect(session).toBeNull();
  });
});
