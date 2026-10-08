import React, { useState } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Image, ImageStyle, ImageContentFit } from 'expo-image';
import { theme } from '../theme';

export interface AppImageProps {
  uri?: string | null;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  contentFit?: ImageContentFit;
  fallbackText?: string;
}

export const AppImage: React.FC<AppImageProps> = ({
  uri,
  style,
  containerStyle,
  contentFit = 'cover',
  fallbackText = 'Bakala',
}) => {
  const [hasError, setHasError] = useState(false);

  const shouldShowFallback = !uri || hasError;

  return (
    <View style={[styles.container, containerStyle]}>
      {shouldShowFallback ? (
        <View style={[styles.fallback, style]}>
          <Text style={styles.fallbackIcon}>🛒</Text>
          <Text style={styles.fallbackText} numberOfLines={1}>
            {fallbackText}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={[styles.image, style]}
          contentFit={contentFit}
          transition={200}
          cachePolicy="memory-disk"
          onError={() => setHasError(true)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: theme.colors.cardMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  fallbackIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  fallbackText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primaryDark,
    fontWeight: theme.fontWeight.semibold,
  },
});
