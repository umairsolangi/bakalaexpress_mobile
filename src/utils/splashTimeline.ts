export const SPLASH_TIMELINE = {
  /** 0 to 200ms: Hold frame 0 identical to native splash */
  FRAME_0_HOLD_MS: 200,
  /** 200 to 700ms: Pepper moves and scales into logo slot */
  PEPPER_MOVE_START_MS: 200,
  PEPPER_MOVE_DURATION_MS: 500,
  /** Spring config targeting <= 5% overshoot */
  PEPPER_SPRING_TENSION: 45,
  PEPPER_SPRING_FRICTION: 8,

  /** 450 to 850ms: BA slides in from 20dp left with fade */
  BA_START_MS: 450,
  BA_DURATION_MS: 400,
  BA_TRANSLATE_X_DP: 20,

  /** ALA starts 60ms after BA (510ms) and slides in from 20dp right */
  ALA_START_MS: 510,
  ALA_DURATION_MS: 400,
  ALA_TRANSLATE_X_DP: 20,

  /** 800 to 1100ms: EXPRESS fades in while moving up 10dp */
  EXPRESS_START_MS: 800,
  EXPRESS_DURATION_MS: 300,
  EXPRESS_TRANSLATE_Y_DP: 10,

  /** 1000 to 1400ms: Swoosh reveals left to right */
  SWOOSH_START_MS: 1000,
  SWOOSH_DURATION_MS: 400,

  /** Optional tagline fades in at 1100ms */
  TAGLINE_START_MS: 1100,
  TAGLINE_DURATION_MS: 300,

  /** Minimum total visible time for start experience */
  MIN_VISIBLE_TIME_MS: 1500,
  /** Total standard animation runtime */
  TOTAL_ANIMATION_MS: 1400,

  /** Threshold for "Taking longer than usual" hint */
  SLOW_SESSION_WARNING_MS: 4000,

  /** Fade out duration when leaving splash screen */
  EXIT_FADE_MS: 250,

  /** Reduced motion timeline */
  REDUCED_MOTION_FADE_IN_MS: 250,
  REDUCED_MOTION_HOLD_MS: 600,
} as const;

export const SHOW_TAGLINE = false;
