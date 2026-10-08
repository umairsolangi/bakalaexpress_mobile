import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Bakala Express',
  slug: 'bakala-express',
  scheme: 'bakalaexpress',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/brand/icon.png',
  // userInterfaceStyle is set to 'light' for now because the logo uses black text; dark mode needs its own design later
  userInterfaceStyle: 'light',
  android: {
    package: 'com.bakalaexpress.customer',
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/brand/adaptive-foreground.png',
      monochromeImage: './assets/brand/adaptive-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  ios: {
    bundleIdentifier: 'com.bakalaexpress.customer',
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/brand/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        dark: {
          backgroundColor: '#FFFFFF',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
