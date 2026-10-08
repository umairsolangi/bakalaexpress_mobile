import { UserRole } from '../api/types';

export interface GuardParams {
  role: UserRole | null;
  isGuest: boolean;
  path: string;
}

export function getRoleHome(role: UserRole): string {
  switch (role) {
    case 'customer':
      return '/(tabs)';
    case 'seller':
      return '/(seller)/home';
    case 'rider':
      return '/(rider)/home';
    case 'admin':
      return '/(admin)/home';
  }
}

export function isAuthPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return (
    normalized.includes('(auth)') ||
    normalized.includes('/welcome') ||
    normalized.includes('/login') ||
    normalized.includes('/register') ||
    normalized.includes('/otp') ||
    normalized.includes('/forgot-password') ||
    normalized.includes('/reset-password') ||
    normalized.includes('/waiting-approval') ||
    normalized.includes('/seller-register') ||
    normalized.includes('/rider-register') ||
    normalized.includes('/terms')
  );
}

export function isCustomerPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return (
    normalized.includes('(customer)') ||
    normalized.includes('(tabs)') ||
    normalized.includes('/sellers/')
  );
}

export function isSellerPath(path: string): boolean {
  return path.toLowerCase().includes('(seller)');
}

export function isRiderPath(path: string): boolean {
  return path.toLowerCase().includes('(rider)');
}

export function isAdminPath(path: string): boolean {
  return path.toLowerCase().includes('(admin)');
}

/**
 * Pure redirect logic for route guard.
 * Returns the target route string to redirect to, or null if the navigation is allowed.
 */
export function resolveRoleRedirect({ role, isGuest, path }: GuardParams): string | null {
  const normalizedPath = (path || '').trim();

  // Root splash screen handles its own initial routing
  if (normalizedPath === '/' || normalizedPath === '') {
    return null;
  }

  // 1. Unauthenticated and NOT guest
  if (!role && !isGuest) {
    if (isAuthPath(normalizedPath)) {
      return null; // Allowed to view auth screens
    }
    // Block all protected areas
    return '/(auth)/welcome';
  }

  // 2. Guest user (customer guest browsing)
  if (!role && isGuest) {
    if (isCustomerPath(normalizedPath) || isAuthPath(normalizedPath)) {
      return null; // Allowed to browse customer catalog & auth
    }
    // Block seller, rider, and admin areas
    if (isSellerPath(normalizedPath) || isRiderPath(normalizedPath) || isAdminPath(normalizedPath)) {
      return '/(auth)/welcome';
    }
    return null;
  }

  // 3. Authenticated user with an active role
  if (role) {
    // If on an auth screen (except waiting-approval or terms), redirect to role home
    if (isAuthPath(normalizedPath)) {
      if (
        normalizedPath.includes('waiting-approval') ||
        normalizedPath.includes('terms')
      ) {
        return null; // Allow viewing pending status or terms
      }
      return getRoleHome(role);
    }

    // Role boundary enforcement
    switch (role) {
      case 'customer':
        if (isSellerPath(normalizedPath) || isRiderPath(normalizedPath) || isAdminPath(normalizedPath)) {
          return getRoleHome('customer');
        }
        break;
      case 'seller':
        if (isCustomerPath(normalizedPath) || isRiderPath(normalizedPath) || isAdminPath(normalizedPath)) {
          return getRoleHome('seller');
        }
        break;
      case 'rider':
        if (isCustomerPath(normalizedPath) || isSellerPath(normalizedPath) || isAdminPath(normalizedPath)) {
          return getRoleHome('rider');
        }
        break;
      case 'admin':
        if (isCustomerPath(normalizedPath) || isSellerPath(normalizedPath) || isRiderPath(normalizedPath)) {
          return getRoleHome('admin');
        }
        break;
    }

    return null;
  }

  return null;
}
