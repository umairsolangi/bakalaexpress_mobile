import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  useWindowDimensions,
  AccessibilityInfo,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import { StatusBar } from 'expo-status-bar';
import { calculateSplashGeometry } from '../utils/splashGeometry';
import { SPLASH_TIMELINE, SHOW_TAGLINE } from '../utils/splashTimeline';
import { useSplashGate } from '../hooks/useSplashGate';
import { useAuthStore } from '../store/authStore';
import { brand } from '../theme/brand';

const PEPPER_IMG = require('../../assets/brand/pepper.png');
const BA_IMG = require('../../assets/brand/ba.png');
const ALA_IMG = require('../../assets/brand/ala.png');
const EXPRESS_IMG = require('../../assets/brand/express.png');
const SWOOSH_IMG = require('../../assets/brand/swoosh.png');
const LOGO_FULL_IMG = require('../../assets/brand/logo-full.png');

export const BRAND_IMAGE_ASSETS = [
  PEPPER_IMG,
  BA_IMG,
  ALA_IMG,
  EXPRESS_IMG,
  SWOOSH_IMG,
  LOGO_FULL_IMG,
];

/** Module-level flag to ensure start animation only runs on cold start */
let hasRunColdStart = false;

export function resetColdStartFlagForTesting() {
  hasRunColdStart = false;
}

export interface AnimatedSplashProps {
  onDismiss?: () => void;
  forceColdStart?: boolean;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({
  onDismiss,
  forceColdStart = false,
}) => {
  // If not a cold start, do not show animation
  const shouldSkipColdStart = hasRunColdStart && !forceColdStart;
  if (shouldSkipColdStart) {
    return null;
  }

  return <AnimatedSplashInternal onDismiss={onDismiss} />;
};

const AnimatedSplashInternal: React.FC<{ onDismiss?: () => void }> = ({ onDismiss }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const geo = calculateSplashGeometry(screenWidth, screenHeight);

  const [assetsPreloaded, setAssetsPreloaded] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [isReduceMotion, setIsReduceMotion] = useState(false);
  const hasHiddenNativeSplash = useRef(false);

  // Animation values
  const pepperProgress = useRef(new Animated.Value(0)).current;
  const baOpacity = useRef(new Animated.Value(0)).current;
  const baTranslateX = useRef(new Animated.Value(-SPLASH_TIMELINE.BA_TRANSLATE_X_DP)).current;
  const alaOpacity = useRef(new Animated.Value(0)).current;
  const alaTranslateX = useRef(new Animated.Value(SPLASH_TIMELINE.ALA_TRANSLATE_X_DP)).current;
  const expressOpacity = useRef(new Animated.Value(0)).current;
  const expressTranslateY = useRef(new Animated.Value(SPLASH_TIMELINE.EXPRESS_TRANSLATE_Y_DP)).current;
  const swooshReveal = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const reducedMotionOpacity = useRef(new Animated.Value(0)).current;

  // Preload brand assets
  useEffect(() => {
    let mounted = true;
    Asset.loadAsync(BRAND_IMAGE_ASSETS)
      .then(() => {
        if (mounted) setAssetsPreloaded(true);
      })
      .catch(() => {
        if (mounted) setAssetsPreloaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Check reduce motion
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setIsReduceMotion(enabled))
      .catch(() => setIsReduceMotion(false));
  }, []);

  // Trigger hideAsync on first onLayout
  const handleLayout = useCallback(() => {
    if (!hasHiddenNativeSplash.current) {
      hasHiddenNativeSplash.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  // Main animation timeline
  useEffect(() => {
    if (!assetsPreloaded) return;

    if (isReduceMotion) {
      // Reduced motion: 250ms fade in, hold 600ms, then finish
      Animated.timing(reducedMotionOpacity, {
        toValue: 1,
        duration: SPLASH_TIMELINE.REDUCED_MOTION_FADE_IN_MS,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setAnimationFinished(true);
        }, SPLASH_TIMELINE.REDUCED_MOTION_HOLD_MS);
      });
      return;
    }

    // Standard sequence
    // 0 to 200ms: hold frame 0
    // 200 to 700ms: pepper moves and scales into slot
    const pepperAnim = Animated.sequence([
      Animated.delay(SPLASH_TIMELINE.FRAME_0_HOLD_MS),
      Animated.spring(pepperProgress, {
        toValue: 1,
        tension: SPLASH_TIMELINE.PEPPER_SPRING_TENSION,
        friction: SPLASH_TIMELINE.PEPPER_SPRING_FRICTION,
        useNativeDriver: true,
      }),
    ]);

    // 450 to 850ms: BA slides in from left
    const baAnim = Animated.sequence([
      Animated.delay(SPLASH_TIMELINE.BA_START_MS),
      Animated.parallel([
        Animated.timing(baOpacity, {
          toValue: 1,
          duration: SPLASH_TIMELINE.BA_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(baTranslateX, {
          toValue: 0,
          duration: SPLASH_TIMELINE.BA_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]);

    // 510 to 910ms: ALA slides in from right (60ms after BA)
    const alaAnim = Animated.sequence([
      Animated.delay(SPLASH_TIMELINE.ALA_START_MS),
      Animated.parallel([
        Animated.timing(alaOpacity, {
          toValue: 1,
          duration: SPLASH_TIMELINE.ALA_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(alaTranslateX, {
          toValue: 0,
          duration: SPLASH_TIMELINE.ALA_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]);

    // 800 to 1100ms: EXPRESS moves up from 10dp with fade
    const expressAnim = Animated.sequence([
      Animated.delay(SPLASH_TIMELINE.EXPRESS_START_MS),
      Animated.parallel([
        Animated.timing(expressOpacity, {
          toValue: 1,
          duration: SPLASH_TIMELINE.EXPRESS_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(expressTranslateY, {
          toValue: 0,
          duration: SPLASH_TIMELINE.EXPRESS_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]);

    // 1000 to 1400ms: Swoosh reveals left to right
    const swooshAnim = Animated.sequence([
      Animated.delay(SPLASH_TIMELINE.SWOOSH_START_MS),
      Animated.timing(swooshReveal, {
        toValue: 1,
        duration: SPLASH_TIMELINE.SWOOSH_DURATION_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    const animations = [pepperAnim, baAnim, alaAnim, expressAnim, swooshAnim];

    if (SHOW_TAGLINE) {
      animations.push(
        Animated.sequence([
          Animated.delay(SPLASH_TIMELINE.TAGLINE_START_MS),
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: SPLASH_TIMELINE.TAGLINE_DURATION_MS,
            useNativeDriver: true,
          }),
        ])
      );
    }

    const parallel = Animated.parallel(animations);
    parallel.start(() => {
      setAnimationFinished(true);
    });

    return () => {
      parallel.stop();
    };
  }, [
    assetsPreloaded,
    isReduceMotion,
    pepperProgress,
    baOpacity,
    baTranslateX,
    alaOpacity,
    alaTranslateX,
    expressOpacity,
    expressTranslateY,
    swooshReveal,
    taglineOpacity,
    reducedMotionOpacity,
  ]);

  // Auth session check via store
  const initAuth = useAuthStore((s) => s.initAuth);

  const {
    showTakingLonger,
    isOffline,
    retry,
    fadeAnim,
    shouldRender,
  } = useSplashGate({
    animationFinished,
    sessionCheck: initAuth,
    onDismiss: () => {
      hasRunColdStart = true;
      onDismiss?.();
    },
  });

  if (!shouldRender) {
    return null;
  }

  // Interpolated transforms for the pepper
  // At progress 0: translateX = deltaX, translateY = deltaY, scale = initialScale
  // At progress 1: translateX = 0, translateY = 0, scale = 1
  const pepperTranslateX = pepperProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [geo.frame0.deltaX, 0],
  });
  const pepperTranslateY = pepperProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [geo.frame0.deltaY, 0],
  });
  const pepperScale = pepperProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [geo.frame0.initialScale, 1],
  });

  // Swoosh white cover slides away from 0 to width
  const swooshCoverTranslateX = swooshReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, geo.slots.swoosh.width],
  });

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim }]}
      onLayout={handleLayout}
      pointerEvents="auto"
    >
      <StatusBar style="dark" />

      {/* Main Logo Container */}
      <View
        style={[
          styles.logoContainer,
          {
            width: geo.logoWidth,
            height: geo.logoHeight,
            left: geo.logoLeft,
            top: geo.logoTop,
          },
        ]}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel="Bakala Express"
      >
        {isReduceMotion ? (
          // Reduced motion static full logo fade-in
          <Animated.Image
            source={LOGO_FULL_IMG}
            style={[
              {
                width: geo.logoWidth,
                height: geo.logoHeight,
                opacity: reducedMotionOpacity,
              },
            ]}
            resizeMode="contain"
          />
        ) : (
          <>
            {/* BA layer */}
            <Animated.Image
              source={BA_IMG}
              style={[
                styles.layerItem,
                {
                  left: geo.slots.ba.x,
                  top: geo.slots.ba.y,
                  width: geo.slots.ba.width,
                  height: geo.slots.ba.height,
                  opacity: baOpacity,
                  transform: [{ translateX: baTranslateX }],
                },
              ]}
              resizeMode="contain"
            />

            {/* ALA layer */}
            <Animated.Image
              source={ALA_IMG}
              style={[
                styles.layerItem,
                {
                  left: geo.slots.ala.x,
                  top: geo.slots.ala.y,
                  width: geo.slots.ala.width,
                  height: geo.slots.ala.height,
                  opacity: alaOpacity,
                  transform: [{ translateX: alaTranslateX }],
                },
              ]}
              resizeMode="contain"
            />

            {/* PEPPER layer (starts in center, springs into logo slot) */}
            <Animated.Image
              source={PEPPER_IMG}
              style={[
                styles.layerItem,
                {
                  left: geo.slots.pepper.x,
                  top: geo.slots.pepper.y,
                  width: geo.slots.pepper.width,
                  height: geo.slots.pepper.height,
                  transform: [
                    { translateX: pepperTranslateX },
                    { translateY: pepperTranslateY },
                    { scale: pepperScale },
                  ],
                },
              ]}
              resizeMode="contain"
            />

            {/* EXPRESS layer */}
            <Animated.Image
              source={EXPRESS_IMG}
              style={[
                styles.layerItem,
                {
                  left: geo.slots.express.x,
                  top: geo.slots.express.y,
                  width: geo.slots.express.width,
                  height: geo.slots.express.height,
                  opacity: expressOpacity,
                  transform: [{ translateY: expressTranslateY }],
                },
              ]}
              resizeMode="contain"
            />

            {/* SWOOSH layer with white cover revealing left to right */}
            <View
              style={[
                styles.layerItem,
                {
                  left: geo.slots.swoosh.x,
                  top: geo.slots.swoosh.y,
                  width: geo.slots.swoosh.width,
                  height: geo.slots.swoosh.height,
                  overflow: 'hidden',
                },
              ]}
            >
              <Image
                source={SWOOSH_IMG}
                style={{
                  width: geo.slots.swoosh.width,
                  height: geo.slots.swoosh.height,
                }}
                resizeMode="contain"
              />
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: swooshCoverTranslateX }],
                  },
                ]}
              />
            </View>
          </>
        )}

        {/* Optional Tagline */}
        {SHOW_TAGLINE && (
          <Animated.Text
            style={[
              styles.tagline,
              {
                top: geo.logoHeight + 20,
                opacity: taglineOpacity,
              },
            ]}
          >
            Fresh essentials at your door
          </Animated.Text>
        )}
      </View>

      {/* Taking Longer indicator */}
      {showTakingLonger && !isOffline && (
        <View style={[styles.statusBox, { top: geo.logoTop + geo.logoHeight + 40 }]}>
          <Text style={styles.statusText}>Taking longer than usual</Text>
        </View>
      )}

      {/* Offline state with Retry */}
      {isOffline && (
        <View style={[styles.offlineBox, { top: geo.logoTop + geo.logoHeight + 40 }]}>
          <Text style={styles.offlineTitle}>Offline, try again</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Retry connecting"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
  },
  logoContainer: {
    position: 'absolute',
  },
  layerItem: {
    position: 'absolute',
  },
  tagline: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 14,
    color: brand.muted,
    fontWeight: '400',
    textAlign: 'center',
  },
  statusBox: {
    position: 'absolute',
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 13,
    color: brand.muted,
    textAlign: 'center',
  },
  offlineBox: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
  },
  offlineTitle: {
    fontSize: 14,
    color: brand.black,
    marginBottom: 12,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: brand.greenDark,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
