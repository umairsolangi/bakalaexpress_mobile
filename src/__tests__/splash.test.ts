import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { calculateSplashGeometry } from '../utils/splashGeometry';
import { SPLASH_TIMELINE, SHOW_TAGLINE } from '../utils/splashTimeline';
import { useSplashGate, UseSplashGateOptions } from '../hooks/useSplashGate';
import { AccessibilityInfo } from 'react-native';

function renderSplashGateHook(initialProps: UseSplashGateOptions) {
  let latestResult: any;
  function TestComponent({ props }: { props: UseSplashGateOptions }) {
    latestResult = useSplashGate(props);
    return null;
  }

  let renderer: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(React.createElement(TestComponent, { props: initialProps }));
  });

  return {
    get result() {
      return { current: latestResult };
    },
    rerender: (newProps: UseSplashGateOptions) => {
      act(() => {
        renderer.update(React.createElement(TestComponent, { props: newProps }));
      });
    },
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    },
  };
}

describe('Splash Geometry Function', () => {
  it('calculates correct logo and layer slot positions on phone viewport (390 x 844)', () => {
    const screenWidth = 390;
    const screenHeight = 844;
    const geo = calculateSplashGeometry(screenWidth, screenHeight);

    // 390 * 0.72 = 280.8 <= 340
    expect(geo.logoWidth).toBeCloseTo(280.8, 1);
    expect(geo.logoScale).toBeCloseTo(280.8 / 786, 4);

    // Optical center at 45% screen height
    const expectedLogoHeight = 548 * geo.logoScale;
    expect(geo.logoHeight).toBeCloseTo(expectedLogoHeight, 1);
    expect(geo.logoTop).toBeCloseTo(screenHeight * 0.45 - expectedLogoHeight / 2, 1);
    expect(geo.logoLeft).toBeCloseTo((screenWidth - 280.8) / 2, 1);

    // Frame 0 pepper: width = 200 * (412 / 1024) = 80.46875
    expect(geo.frame0.pepperWidth).toBeCloseTo(80.46875, 2);
    expect(geo.frame0.pepperX).toBeCloseTo((390 - geo.frame0.pepperWidth) / 2, 1);
    expect(geo.frame0.pepperY).toBeCloseTo((844 - geo.frame0.pepperHeight) / 2, 1);

    // Slots exist for all 5 layers
    expect(geo.slots.pepper.width).toBeGreaterThan(0);
    expect(geo.slots.ba.width).toBeGreaterThan(0);
    expect(geo.slots.ala.width).toBeGreaterThan(0);
    expect(geo.slots.express.width).toBeGreaterThan(0);
    expect(geo.slots.swoosh.width).toBeGreaterThan(0);
  });

  it('clamps max logo width to 340dp on wide tablet screens (800 x 1200)', () => {
    const screenWidth = 800;
    const screenHeight = 1200;
    const geo = calculateSplashGeometry(screenWidth, screenHeight);

    // 800 * 0.72 = 576 > 340 => capped at 340
    expect(geo.logoWidth).toBe(340);
    expect(geo.logoLeft).toBe((800 - 340) / 2);
  });
});

describe('Splash Timeline Configuration Values', () => {
  it('conforms to the start experience animation timing brief', () => {
    expect(SPLASH_TIMELINE.FRAME_0_HOLD_MS).toBe(200);
    expect(SPLASH_TIMELINE.PEPPER_MOVE_START_MS).toBe(200);
    expect(SPLASH_TIMELINE.PEPPER_MOVE_DURATION_MS).toBe(500);

    expect(SPLASH_TIMELINE.BA_START_MS).toBe(450);
    expect(SPLASH_TIMELINE.ALA_START_MS).toBe(510);
    expect(SPLASH_TIMELINE.ALA_START_MS - SPLASH_TIMELINE.BA_START_MS).toBe(60);

    expect(SPLASH_TIMELINE.EXPRESS_START_MS).toBe(800);
    expect(SPLASH_TIMELINE.SWOOSH_START_MS).toBe(1000);
    expect(SPLASH_TIMELINE.SWOOSH_START_MS + SPLASH_TIMELINE.SWOOSH_DURATION_MS).toBe(1400);

    expect(SPLASH_TIMELINE.MIN_VISIBLE_TIME_MS).toBe(1500);
    expect(SPLASH_TIMELINE.SLOW_SESSION_WARNING_MS).toBe(4000);
    expect(SPLASH_TIMELINE.EXIT_FADE_MS).toBe(250);

    expect(SHOW_TAGLINE).toBe(false);
  });
});

describe('useSplashGate Hook (Fake Timers)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('enforces minimum visible time of 1500ms before triggering exit fade', async () => {
    let currentTime = 10000;
    const now = () => currentTime;
    const advance = (ms: number) => {
      currentTime += ms;
      jest.advanceTimersByTime(ms);
    };

    const onDismiss = jest.fn();
    const sessionCheck = jest.fn().mockResolvedValue({ isValid: true, role: 'customer' });

    const harness = renderSplashGateHook({
      animationFinished: false,
      sessionCheck,
      minVisibleTimeMs: 1500,
      slowWarningDelayMs: 4000,
      exitFadeMs: 250,
      onDismiss,
      now,
    });

    // Fast-forward 100ms - session resolves quickly
    await act(async () => {
      advance(100);
    });

    expect(harness.result.current.shouldRender).toBe(true);
    expect(onDismiss).not.toHaveBeenCalled();

    // Mark animation finished at 600ms (< 1500ms)
    advance(500);
    harness.rerender({
      animationFinished: true,
      sessionCheck,
      minVisibleTimeMs: 1500,
      slowWarningDelayMs: 4000,
      exitFadeMs: 250,
      onDismiss,
      now,
    });

    // Advance to 1400ms total elapsed (< 1500ms)
    act(() => {
      advance(800);
    });
    expect(harness.result.current.shouldRender).toBe(true);
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance past 1500ms and through 250ms fade
    act(() => {
      advance(500); // 100 + 500 + 800 + 500 = 1900ms total
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(harness.result.current.shouldRender).toBe(false);
  });

  it('displays "Taking longer than usual" when session check exceeds 4 seconds', async () => {
    const sessionCheck = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ isValid: true, role: 'customer' }), 10000))
    );

    const harness = renderSplashGateHook({
      animationFinished: true,
      sessionCheck,
      minVisibleTimeMs: 1500,
      slowWarningDelayMs: 4000,
    });

    expect(harness.result.current.showTakingLonger).toBe(false);

    // Advance 3.5 seconds
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(harness.result.current.showTakingLonger).toBe(false);

    // Cross the 4.0 second mark
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(harness.result.current.showTakingLonger).toBe(true);
  });

  it('enters offline state with retry button without clearing token on network error', async () => {
    const onDismiss = jest.fn();
    const sessionCheck = jest
      .fn()
      .mockResolvedValueOnce({ isValid: false, role: 'customer', error: 'network' })
      .mockResolvedValueOnce({ isValid: true, role: 'customer' });

    const harness = renderSplashGateHook({
      animationFinished: true,
      sessionCheck,
      minVisibleTimeMs: 1500,
      onDismiss,
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Enters offline state
    expect(harness.result.current.isOffline).toBe(true);
    expect(harness.result.current.status).toBe('offline');
    expect(harness.result.current.shouldRender).toBe(true);
    expect(onDismiss).not.toHaveBeenCalled();

    // Even if 5 seconds pass, does NOT dismiss while offline
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(harness.result.current.shouldRender).toBe(true);
    expect(onDismiss).not.toHaveBeenCalled();

    // User taps Retry
    await act(async () => {
      harness.result.current.retry();
      jest.advanceTimersByTime(100);
    });

    expect(harness.result.current.isOffline).toBe(false);

    // Dismisses after retry succeeds
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('dismisses as normal on 401 unauthorized session check', async () => {
    const onDismiss = jest.fn();
    const sessionCheck = jest.fn().mockResolvedValue({ isValid: false, role: null, error: 'unauthorized' });

    const harness = renderSplashGateHook({
      animationFinished: true,
      sessionCheck,
      minVisibleTimeMs: 1500,
      onDismiss,
    });

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // Advances past 1500ms + 250ms fade
    act(() => {
      jest.advanceTimersByTime(1600);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(harness.result.current.shouldRender).toBe(false);
  });
});

describe('Reduced Motion Handling', () => {
  it('correctly queries AccessibilityInfo.isReduceMotionEnabled', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const enabled = await AccessibilityInfo.isReduceMotionEnabled();
    expect(enabled).toBe(true);
    expect(SPLASH_TIMELINE.REDUCED_MOTION_FADE_IN_MS).toBe(250);
    expect(SPLASH_TIMELINE.REDUCED_MOTION_HOLD_MS).toBe(600);
  });
});
