import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { Asset } from 'expo-asset';

const LOGO_FULL_SOURCE = require('../../assets/brand/logo-full.png');
const PEPPER_MARK_SOURCE = require('../../assets/brand/pepper.png');

export const LOGO_FULL_ASPECT_RATIO = 786 / 548; // ~1.4343 (width / height)
export const PEPPER_MARK_ASPECT_RATIO = 208 / 283; // ~0.7350 (width / height)

// Preload assets for instant rendering
Asset.loadAsync([LOGO_FULL_SOURCE, PEPPER_MARK_SOURCE]).catch(() => {});

export type BrandLogoVariant = 'full' | 'mark';

export type BrandLogoSizePreset = 'sm' | 'md' | 'lg' | 'xl';

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: number | BrandLogoSizePreset;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const PRESET_DIMS: Record<BrandLogoVariant, Record<BrandLogoSizePreset, { width: number; height: number }>> = {
  full: {
    sm: { width: 120, height: 120 / LOGO_FULL_ASPECT_RATIO },
    md: { width: 180, height: 180 / LOGO_FULL_ASPECT_RATIO },
    lg: { width: 240, height: 240 / LOGO_FULL_ASPECT_RATIO },
    xl: { width: 300, height: 300 / LOGO_FULL_ASPECT_RATIO },
  },
  mark: {
    sm: { width: 20 * PEPPER_MARK_ASPECT_RATIO, height: 20 },
    md: { width: 28 * PEPPER_MARK_ASPECT_RATIO, height: 28 },
    lg: { width: 40 * PEPPER_MARK_ASPECT_RATIO, height: 40 },
    xl: { width: 56 * PEPPER_MARK_ASPECT_RATIO, height: 56 },
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size,
  width,
  height,
  style,
  imageStyle,
  accessibilityLabel = 'Bakala Express',
  testID = 'brand-logo',
}) => {
  let finalWidth: number;
  let finalHeight: number;

  const isFull = variant === 'full';
  const aspectRatio = isFull ? LOGO_FULL_ASPECT_RATIO : PEPPER_MARK_ASPECT_RATIO;

  if (width !== undefined && height !== undefined) {
    finalWidth = width;
    finalHeight = height;
  } else if (width !== undefined) {
    finalWidth = width;
    finalHeight = width / aspectRatio;
  } else if (height !== undefined) {
    finalHeight = height;
    finalWidth = height * aspectRatio;
  } else if (typeof size === 'number') {
    if (isFull) {
      finalWidth = size;
      finalHeight = size / aspectRatio;
    } else {
      finalHeight = size;
      finalWidth = size * aspectRatio;
    }
  } else if (typeof size === 'string' && PRESET_DIMS[variant][size]) {
    finalWidth = PRESET_DIMS[variant][size].width;
    finalHeight = PRESET_DIMS[variant][size].height;
  } else {
    // Default dimensions
    if (isFull) {
      finalWidth = 200;
      finalHeight = 200 / aspectRatio;
    } else {
      finalHeight = 28;
      finalWidth = 28 * aspectRatio;
    }
  }

  const source = isFull ? LOGO_FULL_SOURCE : PEPPER_MARK_SOURCE;

  return (
    <View
      style={[styles.container, { width: finalWidth, height: finalHeight }, style]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Image
        source={source}
        style={[{ width: finalWidth, height: finalHeight }, imageStyle]}
        contentFit="contain"
        transition={150}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
