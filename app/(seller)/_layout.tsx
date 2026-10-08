import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

export default function SellerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="account" />
      <Stack.Screen name="orders/[id]" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="verification" />
    </Stack>
  );
}
