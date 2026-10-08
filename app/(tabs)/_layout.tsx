import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useCartStore } from '../../src/store/cartStore';
import { theme } from '../../src/theme';

export default function TabLayout() {
  const totalCount = useCartStore((s) => s.getTotalCount());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🔍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <View style={styles.cartIconWrap}>
              <Text style={[styles.tabIcon, { color }]}>🛒</Text>
              {totalCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {totalCount > 99 ? '99+' : totalCount}
                  </Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 6,
    paddingTop: 6,
    ...theme.shadow.md,
  },
  tabBarItem: {
    minHeight: 44,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
  },
  tabIcon: {
    fontSize: 20,
  },
  cartIconWrap: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
});
