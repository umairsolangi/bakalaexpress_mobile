import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[...rest]" />
    </Stack>
  );
}
