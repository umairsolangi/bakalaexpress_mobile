import { en, ErrorTranslationKey } from './en';

export function t(key: string, params?: Record<string, string | number>): string {
  let current: unknown = en;
  const parts = key.split('.');

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current !== 'string') {
    return key;
  }

  if (!params) {
    return current;
  }

  let result = current;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
  }

  return result;
}

export function getErrorMessage(code?: string | null, fallbackMessage?: string): string {
  if (code && code in en.errors) {
    return en.errors[code as ErrorTranslationKey];
  }
  return fallbackMessage || en.errors.UNKNOWN_ERROR;
}

export * from './en';
