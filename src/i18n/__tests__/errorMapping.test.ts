import { getErrorMessage, en } from '../index';

describe('Error Code Mapping to i18n messages', () => {
  const contractErrorCodes = [
    'UNAUTHENTICATED',
    'FORBIDDEN_ROLE',
    'SELLER_ACCOUNT_INACTIVE',
    'RIDER_ACCOUNT_INACTIVE',
    'ADMIN_ACCOUNT_INACTIVE',
    'PENDING_APPROVAL',
    'ACCOUNT_REMOVED',
    'NOT_FOUND',
    'ORDER_NOT_FOUND',
    'DEVICE_NOT_FOUND',
    'LISTING_NOT_FOUND',
    'VALIDATION_ERROR',
    'INVALID_CREDENTIALS',
    'INVALID_OTP',
    'OTP_EXPIRED',
    'ACCOUNT_NOT_VERIFIED',
    'WRONG_PASSWORD',
    'INVALID_PASSWORD',
    'SAME_PASSWORD',
    'HAS_ACTIVE_ORDERS',
    'DELETION_COOLDOWN',
    'DELETION_REQUEST_PENDING',
    'CHAT_CLOSED',
    'DEVICE_TOKEN_INVALID',
    'PRODUCT_UNAVAILABLE',
    'STOCK_BELOW_ZERO',
    'STOCK_MUTUALLY_EXCLUSIVE',
    'PRICE_EXCEEDS_MAX_MULTIPLIER',
    'SELLER_CATEGORY_MISSING',
    'INVALID_STATUS_TRANSITION',
    'INSUFFICIENT_STOCK',
    'SELLER_CLOSED',
    'ORDER_NOT_CANCELLABLE',
    'RATE_LIMIT_EXCEEDED',
    'RESET_LOCKED',
    'RESET_RESEND_THROTTLED',
    'TOO_MANY_ATTEMPTS',
    'METHOD_NOT_ALLOWED',
    'SERVER_ERROR',
    'MULTIPLE_SELLERS',
    'ITEMS_NOT_FOUND',
    'TIMEOUT_ERROR',
    'NETWORK_ERROR',
    'UNKNOWN_ERROR',
  ];

  it('maps every known contract error code to a meaningful human-readable string', () => {
    for (const code of contractErrorCodes) {
      const message = getErrorMessage(code);
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(5);
      expect(message).not.toBe(code);
    }
  });

  it('returns fallback message or UNKNOWN_ERROR for unknown error codes', () => {
    expect(getErrorMessage('NON_EXISTENT_CODE_XYZ', 'Custom fallback message')).toBe('Custom fallback message');
    expect(getErrorMessage('NON_EXISTENT_CODE_XYZ')).toBe(en.errors.UNKNOWN_ERROR);
    expect(getErrorMessage(null)).toBe(en.errors.UNKNOWN_ERROR);
  });
});
