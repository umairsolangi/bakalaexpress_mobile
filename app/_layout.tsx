import React, { useMemo, useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { setApiQueryClient } from '../src/api/client';
import { useAuthStore } from '../src/store/authStore';
import { resolveRoleRedirect } from '../src/utils/roleGuard';
import { theme } from '../src/theme';
import { AnimatedSplash } from '../src/components/AnimatedSplash';

// Prevent native splash screen from autohiding at module level
SplashScreen.preventAutoHideAsync().catch(() => {});

LogBox.ignoreLogs([
  'Method getInfoAsync imported from "expo-file-system" is deprecated',
  'Response.blob() is using React Native\'s Blob',
]);

function NavigationGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;
    const redirectTarget = resolveRoleRedirect({
      role,
      isGuest,
      path: pathname,
    });

    if (redirectTarget && redirectTarget !== pathname) {
      router.replace(redirectTarget as any);
    }
  }, [pathname, role, isGuest, isInitialized, router]);

  return null;
}

export default function RootLayout() {
  const queryClient = useMemo(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          staleTime: 1000 * 30, // 30 seconds
          refetchOnWindowFocus: false,
        },
      },
    });
    setApiQueryClient(client);
    return client;
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <NavigationGuard />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          <Stack.Screen name="(seller)" options={{ headerShown: false }} />
          <Stack.Screen name="(rider)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sellers/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="sellers/[id]/products/[listing]" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ headerShown: false }} />
          <Stack.Screen name="orders/index" options={{ headerShown: false }} />
          <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="orders/[id]/chat" options={{ headerShown: false }} />
          <Stack.Screen name="favorites" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
          <Stack.Screen name="profile/change-password" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
        <AnimatedSplash />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
