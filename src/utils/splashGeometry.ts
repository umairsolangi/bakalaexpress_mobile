import layersData from '../../assets/brand/layers.json';

export interface LayerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayersMeta {
  pepper: LayerRect;
  ba: LayerRect;
  ala: LayerRect;
  express: LayerRect;
  swoosh: LayerRect;
}

export const LOGO_FULL_WIDTH = 786;
export const LOGO_FULL_HEIGHT = 548;
/** In 1024x1024 splash-icon.png, the pepper's pixel width is 412 */
export const SPLASH_PEPPER_PIXEL_WIDTH = 412;
export const SPLASH_ICON_CANVAS_SIZE = 1024;
export const NATIVE_SPLASH_IMAGE_WIDTH_DP = 200;

export interface SplashGeometry {
  logoWidth: number;
  logoHeight: number;
  logoLeft: number;
  logoTop: number;
  logoScale: number;
  slots: {
    pepper: LayerRect;
    ba: LayerRect;
    ala: LayerRect;
    express: LayerRect;
    swoosh: LayerRect;
  };
  frame0: {
    pepperWidth: number;
    pepperHeight: number;
    pepperX: number;
    pepperY: number;
    initialScale: number;
    deltaX: number;
    deltaY: number;
  };
}

/**
 * Calculates exact pixel / dp coordinates for each logo layer and Frame 0 matching native splash.
 */
export function calculateSplashGeometry(
  screenWidth: number,
  screenHeight: number,
  layers: LayersMeta = layersData as LayersMeta
): SplashGeometry {
  // Finished logo: centered horizontally, width = min(72% of screen width, 340 dp), optical center at ~45% screen height
  const logoWidth = Math.min(screenWidth * 0.72, 340);
  const logoScale = logoWidth / LOGO_FULL_WIDTH;
  const logoHeight = LOGO_FULL_HEIGHT * logoScale;

  const logoLeft = (screenWidth - logoWidth) / 2;
  const logoTop = screenHeight * 0.45 - logoHeight / 2;

  const scaleRect = (r: LayerRect): LayerRect => ({
    x: r.x * logoScale,
    y: r.y * logoScale,
    width: r.width * logoScale,
    height: r.height * logoScale,
  });

  const slots = {
    pepper: scaleRect(layers.pepper),
    ba: scaleRect(layers.ba),
    ala: scaleRect(layers.ala),
    express: scaleRect(layers.express),
    swoosh: scaleRect(layers.swoosh),
  };

  // Frame 0: pepper centered on screen with width = 200 dp * (pepper pixel width / 1024)
  const frame0PepperWidth = NATIVE_SPLASH_IMAGE_WIDTH_DP * (SPLASH_PEPPER_PIXEL_WIDTH / SPLASH_ICON_CANVAS_SIZE);
  const pepperAspectRatio = layers.pepper.height / layers.pepper.width;
  const frame0PepperHeight = frame0PepperWidth * pepperAspectRatio;

  const frame0PepperX = (screenWidth - frame0PepperWidth) / 2;
  const frame0PepperY = (screenHeight - frame0PepperHeight) / 2;

  const finalPepperScreenX = logoLeft + slots.pepper.x;
  const finalPepperScreenY = logoTop + slots.pepper.y;

  const initialScale = frame0PepperWidth / slots.pepper.width;

  const frame0CenterX = screenWidth / 2;
  const frame0CenterY = screenHeight / 2;
  const finalCenterX = finalPepperScreenX + slots.pepper.width / 2;
  const finalCenterY = finalPepperScreenY + slots.pepper.height / 2;

  const deltaX = frame0CenterX - finalCenterX;
  const deltaY = frame0CenterY - finalCenterY;

  return {
    logoWidth,
    logoHeight,
    logoLeft,
    logoTop,
    logoScale,
    slots,
    frame0: {
      pepperWidth: frame0PepperWidth,
      pepperHeight: frame0PepperHeight,
      pepperX: frame0PepperX,
      pepperY: frame0PepperY,
      initialScale,
      deltaX,
      deltaY,
    },
  };
}
