import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { AuthInitResult } from '../store/authStore';
import { SPLASH_TIMELINE } from '../utils/splashTimeline';

export interface UseSplashGateOptions {
  animationFinished: boolean;
  sessionCheck: () => Promise<AuthInitResult>;
  minVisibleTimeMs?: number;
  slowWarningDelayMs?: number;
  exitFadeMs?: number;
  onDismiss?: () => void;
  now?: () => number;
}

export type SplashGateStatus =
  | 'animating'
  | 'waiting'
  | 'taking_longer'
  | 'offline'
  | 'leaving'
  | 'dismissed';

export interface UseSplashGateReturn {
  status: SplashGateStatus;
  showTakingLonger: boolean;
  isOffline: boolean;
  retry: () => void;
  fadeAnim: Animated.Value;
  shouldRender: boolean;
  sessionResult: AuthInitResult | null;
}

/**
 * Pure and testable gate hook for splash screen dismissal.
 * Enforces minimum visible time (1.5s), slow network warning (>4s),
 * offline retry state without clearing tokens, and 250ms exit fade.
 */
export function useSplashGate({
  animationFinished,
  sessionCheck,
  minVisibleTimeMs = SPLASH_TIMELINE.MIN_VISIBLE_TIME_MS,
  slowWarningDelayMs = SPLASH_TIMELINE.SLOW_SESSION_WARNING_MS,
  exitFadeMs = SPLASH_TIMELINE.EXIT_FADE_MS,
  onDismiss,
  now = Date.now,
}: UseSplashGateOptions): UseSplashGateReturn {
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionResult, setSessionResult] = useState<AuthInitResult | null>(null);
  const [showTakingLonger, setShowTakingLonger] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const startTimeRef = useRef<number>(now());
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isLeavingRef = useRef(false);

  const runSessionCheck = useCallback(async () => {
    setIsOffline(false);
    setShowTakingLonger(false);
    setSessionFinished(false);

    const slowTimer = setTimeout(() => {
      setShowTakingLonger(true);
    }, slowWarningDelayMs);

    try {
      const res = await sessionCheck();
      clearTimeout(slowTimer);
      setShowTakingLonger(false);
      setSessionResult(res);

      if (res.error === 'network') {
        setIsOffline(true);
        setSessionFinished(false);
      } else {
        setIsOffline(false);
        setSessionFinished(true);
      }
    } catch {
      clearTimeout(slowTimer);
      setShowTakingLonger(false);
      // Unexpected error - mark offline if network-related or finished
      setIsOffline(true);
      setSessionFinished(false);
    }
  }, [sessionCheck, slowWarningDelayMs]);

  useEffect(() => {
    runSessionCheck();
  }, [runSessionCheck]);

  // Handle dismissal once BOTH animation and session check are complete and not offline
  useEffect(() => {
    if (!animationFinished || !sessionFinished || isOffline || isLeavingRef.current) {
      return;
    }

    const elapsed = now() - startTimeRef.current;
    const remainingHold = Math.max(0, minVisibleTimeMs - elapsed);

    const timer = setTimeout(() => {
      if (isLeavingRef.current) return;
      isLeavingRef.current = true;
      setIsLeaving(true);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: exitFadeMs,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
        onDismiss?.();
      });
    }, remainingHold);

    return () => clearTimeout(timer);
  }, [
    animationFinished,
    sessionFinished,
    isOffline,
    minVisibleTimeMs,
    exitFadeMs,
    fadeAnim,
    onDismiss,
  ]);

  let status: SplashGateStatus = 'animating';
  if (!shouldRender) {
    status = 'dismissed';
  } else if (isLeaving) {
    status = 'leaving';
  } else if (isOffline) {
    status = 'offline';
  } else if (showTakingLonger) {
    status = 'taking_longer';
  } else if (animationFinished && !sessionFinished) {
    status = 'waiting';
  }

  return {
    status,
    showTakingLonger,
    isOffline,
    retry: runSessionCheck,
    fadeAnim,
    shouldRender,
    sessionResult,
  };
}
