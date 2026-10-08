import Constants from 'expo-constants';

function getInitialApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // Detect laptop IP from Expo Go Metro connection
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.packagerOpts?.host ||
    (Constants as any).manifest?.debuggerHost;

  if (typeof hostUri === 'string' && hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }

  return envUrl || 'http://192.168.0.125:8000';
}

export const Config = {
  apiBaseUrl: getInitialApiUrl(),
  enableAdminLogin: process.env.EXPO_PUBLIC_ENABLE_ADMIN_LOGIN !== 'false',
  support: {
    email: 'support@bakalaexpress.com',
    phone: '+92 300 1234567',
    whatsapp: '+92 300 1234567',
  },
} as const;
