import {
  apiClient,
  ApiError,
  setApiQueryClient,
  setOnUnauthorizedListener,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../client';
import { QueryClient } from '@tanstack/react-query';

const originalFetch = globalThis.fetch;

describe('apiClient', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    setApiQueryClient(queryClient);
    await clearStoredToken();
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('unwraps data, meta, and message from a successful JSON envelope', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 1, name: 'Super Store' },
        message: 'Success message',
        meta: { current_page: 1, total: 10 },
      }),
    } as unknown as Response);

    const result = await apiClient<{ id: number; name: string }>('/customer/home');
    expect(result.data).toEqual({ id: 1, name: 'Super Store' });
    expect(result.message).toBe('Success message');
    expect(result.meta).toEqual({ current_page: 1, total: 10 });
  });

  it('throws ApiError with status, code, and errors on failure envelope', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        success: false,
        message: 'Validation failed.',
        code: 'VALIDATION_ERROR',
        errors: {
          email: ['The email field is required.'],
        },
      }),
    } as unknown as Response);

    await expect(apiClient('/customer/auth/login')).rejects.toThrow(ApiError);

    try {
      await apiClient('/customer/auth/login');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.code).toBe('VALIDATION_ERROR');
      expect(apiErr.errors).toEqual({ email: ['The email field is required.'] });
    }
  });

  it('clears stored token, clears QueryClient cache, and invokes unauthorized listener on 401', async () => {
    await setStoredToken('expired_token_123');
    const onUnauthorized = jest.fn();
    setOnUnauthorizedListener(onUnauthorized);

    const clearCacheSpy = jest.spyOn(queryClient, 'clear');

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: 'Unauthenticated.',
        code: 'UNAUTHENTICATED',
      }),
    } as unknown as Response);

    await expect(apiClient('/customer/auth/me')).rejects.toThrow(ApiError);

    const tokenAfter = await getStoredToken();
    expect(tokenAfter).toBeNull();
    expect(clearCacheSpy).toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('throws ApiError with status 408 on timeout', async () => {
    globalThis.fetch = jest.fn().mockImplementation(() => {
      const err = new Error('The user aborted a request.');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    await expect(apiClient('/customer/home', { timeoutMs: 10 })).rejects.toThrow(ApiError);

    try {
      await apiClient('/customer/home', { timeoutMs: 10 });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(408);
      expect(apiErr.code).toBe('TIMEOUT_ERROR');
    }
  });

  it('parses Retry-After header on 429 response', async () => {
    const headers = new Headers();
    headers.set('Retry-After', '60');

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers,
      json: async () => ({
        success: false,
        message: 'Too many requests.',
        code: 'TOO_MANY_ATTEMPTS',
      }),
    } as unknown as Response);

    try {
      await apiClient('/customer/home');
      fail('Should have thrown ApiError');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(429);
      expect(apiErr.retryAfterSeconds).toBe(60);
    }
  });
});
