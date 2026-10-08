import { QueryClient } from '@tanstack/react-query';
import { ApiMeta, ApiResponseEnvelope, UserRole } from './types';
import { getErrorMessage } from '../i18n';
import { Config } from '../config';
import {
  getSession,
  setSession,
  clearSession,
  SESSION_STORAGE_KEY,
} from './session';

export const AUTH_TOKEN_KEY = SESSION_STORAGE_KEY;
const DEFAULT_TIMEOUT_MS = 15000;
const MULTIPART_TIMEOUT_MS = 60000;

export class ApiError extends Error {
  status: number;
  code: string;
  errors: Record<string, string[]>;
  retryAfterSeconds?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    errors: Record<string, string[]> = {},
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Global TanStack QueryClient instance ref so the client can clear it on 401 or logout
let globalQueryClient: QueryClient | null = null;
let onUnauthorizedListener: (() => void) | null = null;
let isHandling401 = false;

export function setApiQueryClient(queryClient: QueryClient | null) {
  globalQueryClient = queryClient;
}

export function getApiQueryClient(): QueryClient | null {
  return globalQueryClient;
}

export function setOnUnauthorizedListener(listener: (() => void) | null) {
  onUnauthorizedListener = listener;
}

/**
 * Backwards-compatible token getter reading from secure session.
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Backwards-compatible token setter (defaults role to customer).
 */
export async function setStoredToken(token: string, role: UserRole = 'customer'): Promise<void> {
  await setSession({ role, token });
}

/**
 * Backwards-compatible token clearer.
 */
export async function clearStoredToken(): Promise<void> {
  await clearSession();
}

export function getApiBaseUrl(): string {
  const rawUrl = Config.apiBaseUrl && Config.apiBaseUrl.trim()
    ? Config.apiBaseUrl.trim()
    : 'http://192.168.0.125:8000';
  // Strip trailing slashes
  const baseUrl = rawUrl.replace(/\/+$/, '');
  return `${baseUrl}/api/v1`;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  token?: string | null;
  skipAuth?: boolean;
}

export interface ClientResponse<T> {
  data: T;
  meta: ApiMeta;
  message: string;
}

/**
 * Universal API fetch wrapper.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ClientResponse<T>> {
  const isFormData = Boolean(
    options.body &&
      typeof options.body === 'object' &&
      ('_parts' in options.body || (typeof FormData !== 'undefined' && options.body instanceof FormData))
  );
  const timeoutMs = options.timeoutMs ?? (isFormData ? MULTIPART_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);

  const {
    token: customToken,
    skipAuth = false,
    headers: customHeaders = {},
    ...restOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Only set application/json if body is NOT FormData
  if (!isFormData) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  } else {
    // CRITICAL: delete Content-Type so fetch sets multipart/form-data boundary automatically
    delete headers['Content-Type'];
    delete headers['content-type'];
    delete headers['Content-type'];
    delete headers['CONTENT-TYPE'];
  }

  if (!skipAuth) {
    const activeToken = customToken !== undefined ? customToken : await getStoredToken();
    if (activeToken) {
      headers.Authorization = `Bearer ${activeToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    console.warn(`[apiClient network error] ${options.method || 'GET'} ${url}:`, error);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        408,
        'TIMEOUT_ERROR',
        getErrorMessage('TIMEOUT_ERROR')
      );
    }

    const detail = error instanceof Error && error.message ? `: ${error.message}` : '';
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      `${getErrorMessage('NETWORK_ERROR')}${detail}`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const status = response.status;

  // Read response body as JSON
  let json: ApiResponseEnvelope<T> | (Record<string, unknown> & { success?: boolean; message?: string; code?: string; errors?: Record<string, string[]> }) | null = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  // Handle 401 Unauthorized (Expired or Revoked token)
  if (status === 401) {
    const isLoginEndpoint = endpoint.includes('/auth/login');
    if (!isLoginEndpoint && !isHandling401) {
      isHandling401 = true;
      try {
        await clearSession();
        if (globalQueryClient) {
          globalQueryClient.clear();
        }
        if (onUnauthorizedListener) {
          onUnauthorizedListener();
        }
      } finally {
        setTimeout(() => {
          isHandling401 = false;
        }, 1000);
      }
    }
  }

  // Handle 429 Rate Limit
  let retryAfterSeconds: number | undefined;
  if (status === 429) {
    const retryHeader = response.headers.get('Retry-After');
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10);
      if (!isNaN(parsed)) {
        retryAfterSeconds = parsed;
      }
    }
  }

  // Handle Failure
  const errorJson = json as (Record<string, unknown> & { success?: boolean; message?: string; code?: string; errors?: Record<string, string[]> }) | null;
  if (!response.ok || (errorJson && errorJson.success === false)) {
    const code = (errorJson?.code as string) || (status === 422 ? 'VALIDATION_ERROR' : status === 401 ? 'UNAUTHENTICATED' : status === 429 ? 'TOO_MANY_ATTEMPTS' : status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR');
    const serverMessage = (errorJson?.message as string) || response.statusText;
    const errors = (errorJson?.errors as Record<string, string[]>) || {};
    const friendlyMessage = getErrorMessage(code, serverMessage);

    throw new ApiError(status, code, friendlyMessage, errors, retryAfterSeconds);
  }

  // Success response
  const envelope = json as ApiResponseEnvelope<T>;
  return {
    data: envelope?.data ?? ({} as T),
    meta: envelope?.meta ?? {},
    message: envelope?.message ?? '',
  };
}
