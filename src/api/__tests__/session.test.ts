import * as SecureStore from 'expo-secure-store';
import {
  getSession,
  setSession,
  clearSession,
  SESSION_STORAGE_KEY,
  LEGACY_AUTH_TOKEN_KEY,
  isValidRole,
} from '../session';

describe('session helpers', () => {
  beforeEach(async () => {
    await clearSession();
    jest.clearAllMocks();
  });

  describe('isValidRole', () => {
    it('accepts customer, seller, rider, admin', () => {
      expect(isValidRole('customer')).toBe(true);
      expect(isValidRole('seller')).toBe(true);
      expect(isValidRole('rider')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
    });

    it('rejects unknown or invalid roles', () => {
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(123)).toBe(false);
    });
  });

  describe('setSession and getSession', () => {
    it('stores and retrieves a customer session', async () => {
      await setSession({ role: 'customer', token: 'token_customer_123' });
      const session = await getSession();
      expect(session).toEqual({
        role: 'customer',
        token: 'token_customer_123',
      });
    });

    it('stores and retrieves a seller session', async () => {
      await setSession({ role: 'seller', token: 'token_seller_456' });
      const session = await getSession();
      expect(session).toEqual({
        role: 'seller',
        token: 'token_seller_456',
      });
    });

    it('stores and retrieves a rider session', async () => {
      await setSession({ role: 'rider', token: 'token_rider_789' });
      const session = await getSession();
      expect(session).toEqual({
        role: 'rider',
        token: 'token_rider_789',
      });
    });

    it('stores and retrieves an admin session', async () => {
      await setSession({ role: 'admin', token: 'token_admin_000' });
      const session = await getSession();
      expect(session).toEqual({
        role: 'admin',
        token: 'token_admin_000',
      });
    });

    it('throws error when setting session with invalid role', async () => {
      // @ts-expect-error Testing invalid runtime input
      await expect(setSession({ role: 'manager', token: 'xyz' })).rejects.toThrow();
    });

    it('throws error when setting session with empty token', async () => {
      await expect(setSession({ role: 'customer', token: '   ' })).rejects.toThrow();
    });
  });

  describe('clearSession', () => {
    it('removes the stored session so getSession returns null', async () => {
      await setSession({ role: 'seller', token: 'token_abc' });
      expect(await getSession()).not.toBeNull();

      await clearSession();
      expect(await getSession()).toBeNull();
    });
  });

  describe('corrupt or legacy storage handling', () => {
    it('clears storage and returns null if stored JSON is corrupt', async () => {
      await SecureStore.setItemAsync(SESSION_STORAGE_KEY, '{invalid json');
      const session = await getSession();
      expect(session).toBeNull();
      // Verifies storage was cleaned
      expect(await SecureStore.getItemAsync(SESSION_STORAGE_KEY)).toBeNull();
    });

    it('clears storage and returns null if stored role is unknown', async () => {
      await SecureStore.setItemAsync(
        SESSION_STORAGE_KEY,
        JSON.stringify({ role: 'unknown_alien', token: '123' })
      );
      const session = await getSession();
      expect(session).toBeNull();
    });

    it('migrates legacy customer token if found', async () => {
      await SecureStore.setItemAsync(LEGACY_AUTH_TOKEN_KEY, 'legacy_cust_token');
      const session = await getSession();
      expect(session).toEqual({
        role: 'customer',
        token: 'legacy_cust_token',
      });
      // Legacy key should have been deleted
      expect(await SecureStore.getItemAsync(LEGACY_AUTH_TOKEN_KEY)).toBeNull();
    });
  });
});
