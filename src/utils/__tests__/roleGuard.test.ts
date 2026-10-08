import {
  resolveRoleRedirect,
  getRoleHome,
  isAuthPath,
  isCustomerPath,
  isSellerPath,
  isRiderPath,
  isAdminPath,
} from '../roleGuard';

describe('roleGuard pure redirect logic', () => {
  describe('role home paths', () => {
    it('maps every role to its appropriate home route', () => {
      expect(getRoleHome('customer')).toBe('/(tabs)');
      expect(getRoleHome('seller')).toBe('/(seller)/home');
      expect(getRoleHome('rider')).toBe('/(rider)/home');
      expect(getRoleHome('admin')).toBe('/(admin)/home');
    });
  });

  describe('unauthenticated non-guest user', () => {
    it('allows access to auth screens', () => {
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(auth)/welcome' })).toBeNull();
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(auth)/login' })).toBeNull();
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(auth)/register' })).toBeNull();
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(auth)/waiting-approval' })).toBeNull();
    });

    it('blocks access to protected customer routes and redirects to welcome', () => {
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(tabs)' })).toBe('/(auth)/welcome');
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(tabs)/account' })).toBe('/(auth)/welcome');
    });

    it('blocks access to protected seller/rider/admin routes and redirects to welcome', () => {
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(seller)/home' })).toBe('/(auth)/welcome');
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(rider)/home' })).toBe('/(auth)/welcome');
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/(admin)/home' })).toBe('/(auth)/welcome');
    });

    it('allows splash screen root', () => {
      expect(resolveRoleRedirect({ role: null, isGuest: false, path: '/' })).toBeNull();
    });
  });

  describe('guest user', () => {
    it('allows browsing customer tabs and auth screens', () => {
      expect(resolveRoleRedirect({ role: null, isGuest: true, path: '/(tabs)' })).toBeNull();
      expect(resolveRoleRedirect({ role: null, isGuest: true, path: '/(tabs)/search' })).toBeNull();
      expect(resolveRoleRedirect({ role: null, isGuest: true, path: '/sellers/12' })).toBeNull();
      expect(resolveRoleRedirect({ role: null, isGuest: true, path: '/(auth)/welcome' })).toBeNull();
    });

    it('blocks guest from seller, rider, and admin areas', () => {
      expect(resolveRoleRedirect({ role: null, isGuest: true, path: '/(seller)/home' })).toBe('/(auth)/welcome');
      expect(resolveRoleRedirect({ role: null, isGuest: true, path: '/(rider)/home' })).toBe('/(auth)/welcome');
      expect(resolveRoleRedirect({ role: null, isGuest: true, path: '/(admin)/home' })).toBe('/(auth)/welcome');
    });
  });

  describe('authenticated customer', () => {
    it('allows access to customer areas', () => {
      expect(resolveRoleRedirect({ role: 'customer', isGuest: false, path: '/(tabs)' })).toBeNull();
      expect(resolveRoleRedirect({ role: 'customer', isGuest: false, path: '/sellers/5' })).toBeNull();
    });

    it('redirects to customer home if visiting login or welcome', () => {
      expect(resolveRoleRedirect({ role: 'customer', isGuest: false, path: '/(auth)/login' })).toBe('/(tabs)');
      expect(resolveRoleRedirect({ role: 'customer', isGuest: false, path: '/(auth)/welcome' })).toBe('/(tabs)');
    });

    it('blocks customer from accessing seller, rider, and admin areas', () => {
      expect(resolveRoleRedirect({ role: 'customer', isGuest: false, path: '/(seller)/home' })).toBe('/(tabs)');
      expect(resolveRoleRedirect({ role: 'customer', isGuest: false, path: '/(rider)/home' })).toBe('/(tabs)');
      expect(resolveRoleRedirect({ role: 'customer', isGuest: false, path: '/(admin)/home' })).toBe('/(tabs)');
    });
  });

  describe('authenticated seller', () => {
    it('allows access to seller area', () => {
      expect(resolveRoleRedirect({ role: 'seller', isGuest: false, path: '/(seller)/home' })).toBeNull();
      expect(resolveRoleRedirect({ role: 'seller', isGuest: false, path: '/(seller)/account' })).toBeNull();
    });

    it('blocks seller from customer, rider, and admin areas', () => {
      expect(resolveRoleRedirect({ role: 'seller', isGuest: false, path: '/(tabs)' })).toBe('/(seller)/home');
      expect(resolveRoleRedirect({ role: 'seller', isGuest: false, path: '/(rider)/home' })).toBe('/(seller)/home');
      expect(resolveRoleRedirect({ role: 'seller', isGuest: false, path: '/(admin)/home' })).toBe('/(seller)/home');
    });
  });

  describe('authenticated rider', () => {
    it('allows access to rider area', () => {
      expect(resolveRoleRedirect({ role: 'rider', isGuest: false, path: '/(rider)/home' })).toBeNull();
      expect(resolveRoleRedirect({ role: 'rider', isGuest: false, path: '/(rider)/account' })).toBeNull();
    });

    it('blocks rider from customer, seller, and admin areas', () => {
      expect(resolveRoleRedirect({ role: 'rider', isGuest: false, path: '/(tabs)' })).toBe('/(rider)/home');
      expect(resolveRoleRedirect({ role: 'rider', isGuest: false, path: '/(seller)/home' })).toBe('/(rider)/home');
      expect(resolveRoleRedirect({ role: 'rider', isGuest: false, path: '/(admin)/home' })).toBe('/(rider)/home');
    });
  });

  describe('authenticated admin', () => {
    it('allows access to admin area', () => {
      expect(resolveRoleRedirect({ role: 'admin', isGuest: false, path: '/(admin)/home' })).toBeNull();
    });

    it('blocks admin from customer, seller, and rider areas', () => {
      expect(resolveRoleRedirect({ role: 'admin', isGuest: false, path: '/(tabs)' })).toBe('/(admin)/home');
      expect(resolveRoleRedirect({ role: 'admin', isGuest: false, path: '/(seller)/home' })).toBe('/(admin)/home');
      expect(resolveRoleRedirect({ role: 'admin', isGuest: false, path: '/(rider)/home' })).toBe('/(admin)/home');
    });
  });
});
