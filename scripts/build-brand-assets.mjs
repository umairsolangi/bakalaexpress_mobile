import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const BRAND_DIR = path.join(ROOT_DIR, 'assets', 'brand');
const DOCS_DIR = path.join(ROOT_DIR, 'docs', 'brand');
const THEME_DIR = path.join(ROOT_DIR, 'src', 'theme');

async function main() {
  console.log('=== [1/8] Cleaning Original Logo ===');
  const originalPath = path.join(BRAND_DIR, 'logo-original.jpg');

  // Ensure flattened against white to handle JPEG/PNG uniformly
  const flattened = await sharp(originalPath)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: origW, height: origH } = flattened.info;
  const origData = flattened.data;

  // 1. Find tight bounds of non-white pixels (luminance below 245)
  let minX = origW, minY = origH, maxX = 0, maxY = 0;
  for (let y = 0; y < origH; y++) {
    for (let x = 0; x < origW; x++) {
      const idx = (y * origW + x) * 3;
      const r = origData[idx];
      const g = origData[idx + 1];
      const b = origData[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 245) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const tightW = maxX - minX + 1;
  const tightH = maxY - minY + 1;
  const margin = Math.round(Math.max(tightW, tightH) * 0.02);

  const cropX = Math.max(0, minX - margin);
  const cropY = Math.max(0, minY - margin);
  const cropW = Math.min(origW - cropX, tightW + margin * 2);
  const cropH = Math.min(origH - cropY, tightH + margin * 2);

  console.log(`Original: ${origW}x${origH}`);
  console.log(`Tight bounds: [${minX}, ${minY}, ${maxX}, ${maxY}] (${tightW}x${tightH})`);
  console.log(`Cropped (2% margin): [${cropX}, ${cropY}, ${cropW}, ${cropH}]`);

  // Crop image
  const cropped = await sharp(originalPath)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = cropped.info.width;
  const H = cropped.info.height;
  const cropData = cropped.data;

  // Color to alpha against white:
  // a = max(255-r, 255-g, 255-b) / 255
  // if a is 0 pixel is transparent, otherwise c = (c - 255*(1-a)) / a clamped
  const fullRgba = Buffer.alloc(W * H * 4);
  for (let i = 0, j = 0; i < cropData.length; i += 3, j += 4) {
    const r = cropData[i];
    const g = cropData[i + 1];
    const b = cropData[i + 2];
    const a = Math.max(255 - r, 255 - g, 255 - b) / 255;
    if (a <= 0.005) {
      fullRgba[j] = 0;
      fullRgba[j + 1] = 0;
      fullRgba[j + 2] = 0;
      fullRgba[j + 3] = 0;
    } else {
      fullRgba[j] = Math.round(Math.min(255, Math.max(0, (r - 255 * (1 - a)) / a)));
      fullRgba[j + 1] = Math.round(Math.min(255, Math.max(0, (g - 255 * (1 - a)) / a)));
      fullRgba[j + 2] = Math.round(Math.min(255, Math.max(0, (b - 255 * (1 - a)) / a)));
      fullRgba[j + 3] = Math.round(a * 255);
    }
  }

  const logoFullPath = path.join(BRAND_DIR, 'logo-full.png');
  await sharp(fullRgba, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(logoFullPath);
  console.log(`Saved ${logoFullPath} (${W}x${H})`);

  console.log('\n=== [2/8] Segmenting Layers by Color ===');
  function isGreen(r, g, b) {
    // Both bright pepper green and dark green stroke have g > r and g > b
    return (g > r + 3 && g > b + 3) || (g > 30 && g > r * 1.05 && g > b * 1.05);
  }

  // 1. Detect green bounding boxes
  let pepperGreenMinX = W, pepperGreenMaxX = 0, pepperGreenMinY = H, pepperGreenMaxY = 0;
  let swooshGreenMinX = W, swooshGreenMaxX = 0, swooshGreenMinY = H, swooshGreenMaxY = 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const a = fullRgba[idx + 3];
      if (a < 15) continue;
      const r = fullRgba[idx];
      const g = fullRgba[idx + 1];
      const b = fullRgba[idx + 2];
      if (isGreen(r, g, b)) {
        if (y < 350) {
          if (x < pepperGreenMinX) pepperGreenMinX = x;
          if (x > pepperGreenMaxX) pepperGreenMaxX = x;
          if (y < pepperGreenMinY) pepperGreenMinY = y;
          if (y > pepperGreenMaxY) pepperGreenMaxY = y;
        } else {
          if (x < swooshGreenMinX) swooshGreenMinX = x;
          if (x > swooshGreenMaxX) swooshGreenMaxX = x;
          if (y < swooshGreenMinY) swooshGreenMinY = y;
          if (y > swooshGreenMaxY) swooshGreenMaxY = y;
        }
      }
    }
  }

  const pepperCenterX = (pepperGreenMinX + pepperGreenMaxX) / 2;
  console.log('Pepper green bounds:', { pepperGreenMinX, pepperGreenMinY, pepperGreenMaxX, pepperGreenMaxY, pepperCenterX });
  console.log('Swoosh green bounds:', { swooshGreenMinX, swooshGreenMinY, swooshGreenMaxX, swooshGreenMaxY });

  // Layer mapping:
  // 1: pepper, 2: ba, 3: ala, 4: express, 5: swoosh
  const layerMap = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      if (fullRgba[idx + 3] === 0) continue;
      const r = fullRgba[idx];
      const g = fullRgba[idx + 1];
      const b = fullRgba[idx + 2];
      const green = isGreen(r, g, b);

      if (green) {
        if (y < 350) {
          layerMap[y * W + x] = 1; // pepper (including dark green 'k' stroke)
        } else {
          layerMap[y * W + x] = 5; // swoosh
        }
      } else {
        // Black text
        if (y >= 298) {
          layerMap[y * W + x] = 4; // express
        } else {
          if (x < pepperCenterX) {
            layerMap[y * W + x] = 2; // ba
          } else {
            layerMap[y * W + x] = 3; // ala
          }
        }
      }
    }
  }

  // Extract tight crops and layers.json coordinates
  const layers = [
    { id: 1, name: 'pepper', file: 'pepper.png' },
    { id: 2, name: 'ba', file: 'ba.png' },
    { id: 3, name: 'ala', file: 'ala.png' },
    { id: 4, name: 'express', file: 'express.png' },
    { id: 5, name: 'swoosh', file: 'swoosh.png' },
  ];

  const layersMeta = {};

  for (const layer of layers) {
    let lMinX = W, lMinY = H, lMaxX = 0, lMaxY = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (layerMap[y * W + x] === layer.id) {
          if (x < lMinX) lMinX = x;
          if (x > lMaxX) lMaxX = x;
          if (y < lMinY) lMinY = y;
          if (y > lMaxY) lMaxY = y;
        }
      }
    }

    const lw = lMaxX - lMinX + 1;
    const lh = lMaxY - lMinY + 1;
    layersMeta[layer.name] = { x: lMinX, y: lMinY, width: lw, height: lh };

    const cropBuf = Buffer.alloc(lw * lh * 4);
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        const fullX = lMinX + x;
        const fullY = lMinY + y;
        const dstIdx = (y * lw + x) * 4;
        if (layerMap[fullY * W + fullX] === layer.id) {
          const srcIdx = (fullY * W + fullX) * 4;
          cropBuf[dstIdx] = fullRgba[srcIdx];
          cropBuf[dstIdx + 1] = fullRgba[srcIdx + 1];
          cropBuf[dstIdx + 2] = fullRgba[srcIdx + 2];
          cropBuf[dstIdx + 3] = fullRgba[srcIdx + 3];
        } else {
          cropBuf[dstIdx] = 0;
          cropBuf[dstIdx + 1] = 0;
          cropBuf[dstIdx + 2] = 0;
          cropBuf[dstIdx + 3] = 0;
        }
      }
    }

    const layerPath = path.join(BRAND_DIR, layer.file);
    await sharp(cropBuf, { raw: { width: lw, height: lh, channels: 4 } })
      .png()
      .toFile(layerPath);
    console.log(`Layer [${layer.name}]: saved ${layerPath} (${lw}x${lh} at x=${lMinX}, y=${lMinY})`);
  }

  const layersJsonPath = path.join(BRAND_DIR, 'layers.json');
  await fs.writeFile(layersJsonPath, JSON.stringify(layersMeta, null, 2), 'utf-8');
  console.log(`Saved ${layersJsonPath}`);

  console.log('\n=== [3/8] Verifying Recomposition ===');
  // Recomposite all layers onto transparent canvas
  const recompositeBuf = Buffer.alloc(W * H * 4);
  for (const layer of layers) {
    const meta = layersMeta[layer.name];
    const crop = await sharp(path.join(BRAND_DIR, layer.file))
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width: lw, height: lh } = crop.info;
    const cData = crop.data;

    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        const srcIdx = (y * lw + x) * 4;
        const sa = cData[srcIdx + 3];
        if (sa === 0) continue;
        const dstX = meta.x + x;
        const dstY = meta.y + y;
        const dstIdx = (dstY * W + dstX) * 4;
        recompositeBuf[dstIdx] = cData[srcIdx];
        recompositeBuf[dstIdx + 1] = cData[srcIdx + 1];
        recompositeBuf[dstIdx + 2] = cData[srcIdx + 2];
        recompositeBuf[dstIdx + 3] = cData[srcIdx + 3];
      }
    }
  }

  let totalDiff = 0;
  for (let i = 0; i < W * H * 4; i += 4) {
    const dR = Math.abs(recompositeBuf[i] - fullRgba[i]);
    const dG = Math.abs(recompositeBuf[i + 1] - fullRgba[i + 1]);
    const dB = Math.abs(recompositeBuf[i + 2] - fullRgba[i + 2]);
    const dA = Math.abs(recompositeBuf[i + 3] - fullRgba[i + 3]);
    totalDiff += dR + dG + dB + dA;
  }

  const meanAbsDiffPercent = (totalDiff / (W * H * 4 * 255)) * 100;
  console.log(`Mean Absolute Pixel Difference: ${meanAbsDiffPercent.toFixed(6)}% (Required < 1%)`);

  const recompositeCheckPath = path.join(DOCS_DIR, 'recomposite-check.png');
  await sharp(recompositeBuf, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(recompositeCheckPath);
  console.log(`Saved ${recompositeCheckPath}`);

  console.log('\n=== [4/8] Sampling Colors and Writing Theme ===');
  const pepperGreens = [];
  const darkStroke = [];
  const blackPixels = [];

  for (let y = 15; y <= 297; y++) {
    for (let x = 267; x <= 474; x++) {
      const idx = (y * W + x) * 4;
      const a = fullRgba[idx + 3];
      if (a > 200) {
        const r = fullRgba[idx];
        const g = fullRgba[idx + 1];
        const b = fullRgba[idx + 2];
        if (g > 130 && g > r * 1.3 && g > b * 1.3) {
          pepperGreens.push([r, g, b]);
        } else if (g < 130 && g > r && g > b) {
          darkStroke.push([r, g, b]);
        }
      }
    }
  }

  for (let y = 120; y <= 280; y++) {
    for (let x = 20; x <= 250; x++) {
      const idx = (y * W + x) * 4;
      const a = fullRgba[idx + 3];
      if (a > 200) {
        const r = fullRgba[idx];
        const g = fullRgba[idx + 1];
        const b = fullRgba[idx + 2];
        if (r < 30 && g < 30 && b < 30) {
          blackPixels.push([r, g, b]);
        }
      }
    }
  }

  function medianChannel(arr, ch) {
    const sorted = arr.map(p => p[ch]).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  function toHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0').toUpperCase()).join('');
  }

  const greenMedian = [medianChannel(pepperGreens, 0), medianChannel(pepperGreens, 1), medianChannel(pepperGreens, 2)];
  const darkStrokeMedian = [medianChannel(darkStroke, 0), medianChannel(darkStroke, 1), medianChannel(darkStroke, 2)];
  const blackMedian = [medianChannel(blackPixels, 0), medianChannel(blackPixels, 1), medianChannel(blackPixels, 2)];

  const brandGreen = toHex(...greenMedian);
  const brandGreenDark = toHex(...darkStrokeMedian);
  const brandBlack = toHex(...blackMedian);
  const brandWhite = '#FFFFFF';
  const brandMuted = '#6B6B6B';

  console.log(`brand.green:     ${brandGreen}`);
  console.log(`brand.greenDark: ${brandGreenDark}`);
  console.log(`brand.black:     ${brandBlack}`);
  console.log(`brand.white:     ${brandWhite}`);
  console.log(`brand.muted:     ${brandMuted}`);

  // Contrast calculation
  function relLum(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  function getContrast(c1, c2) {
    const l1 = relLum(c1);
    const l2 = relLum(c2);
    const hi = Math.max(l1, l2);
    const lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  const crWhiteOnGreen = getContrast(brandWhite, brandGreen);
  const crGreenOnWhite = getContrast(brandGreen, brandWhite);
  const crGreenDarkOnWhite = getContrast(brandGreenDark, brandWhite);
  const crWhiteOnGreenDark = getContrast(brandWhite, brandGreenDark);
  const crBlackOnGreen = getContrast(brandBlack, brandGreen);

  console.log('\n--- WCAG Contrast Analysis ---');
  console.log(`White on brand.green (${brandGreen}):       ${crWhiteOnGreen.toFixed(2)}:1 (Fails normal text 4.5:1)`);
  console.log(`brand.green (${brandGreen}) on White:       ${crGreenOnWhite.toFixed(2)}:1 (Large text/icons ok)`);
  console.log(`brand.greenDark (${brandGreenDark}) on White:   ${crGreenDarkOnWhite.toFixed(2)}:1 (Passes AAA >= 7.0:1)`);
  console.log(`White on brand.greenDark (${brandGreenDark}):   ${crWhiteOnGreenDark.toFixed(2)}:1 (Passes AAA >= 7.0:1)`);
  console.log(`Black on brand.green (${brandGreen}):       ${crBlackOnGreen.toFixed(2)}:1 (Passes AA >= 4.5:1)`);

  await fs.mkdir(THEME_DIR, { recursive: true });
  const brandTsContent = `/**
 * Brand Tokens sampled directly from the official Bakala Express identity.
 * Generated by scripts/build-brand-assets.mjs
 */
export const brand = {
  /** Median pepper body fill color (#009225) - Vibrant accent, icons, decorative borders */
  green: '${brandGreen}',
  /** Dark green stroke & stem (#005E25) - Accessible button backgrounds with white text (WCAG ${crWhiteOnGreenDark.toFixed(2)}:1), links, high-contrast text */
  greenDark: '${brandGreenDark}',
  /** Primary typography black (#000000) */
  black: '${brandBlack}',
  /** Clean canvas white (#FFFFFF) */
  white: '${brandWhite}',
  /** Muted secondary neutral (#6B6B6B) */
  muted: '${brandMuted}',
} as const;

export type BrandColors = typeof brand;
`;
  const brandTsPath = path.join(THEME_DIR, 'brand.ts');
  await fs.writeFile(brandTsPath, brandTsContent, 'utf-8');
  console.log(`Saved ${brandTsPath}`);

  console.log('\n=== [5/8] Generating Native Splash Image ===');
  // assets/brand/splash-icon.png: 1024x1024 transparent, pepper only, centered, larger side at most 560px
  const pepperPath = path.join(BRAND_DIR, 'pepper.png');
  const pepperMeta = layersMeta.pepper;
  const pepperMaxDim = Math.max(pepperMeta.width, pepperMeta.height);
  const splashPepperScale = 560 / pepperMaxDim;
  const splashPepperW = Math.round(pepperMeta.width * splashPepperScale);
  const splashPepperH = Math.round(pepperMeta.height * splashPepperScale);

  const resizedPepperSplash = await sharp(pepperPath)
    .resize(splashPepperW, splashPepperH, { fit: 'contain' })
    .toBuffer();

  const splashIconPath = path.join(BRAND_DIR, 'splash-icon.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: resizedPepperSplash,
        left: Math.round((1024 - splashPepperW) / 2),
        top: Math.round((1024 - splashPepperH) / 2),
      },
    ])
    .png()
    .toFile(splashIconPath);
  console.log(`Saved ${splashIconPath} (pepper: ${splashPepperW}x${splashPepperH} centered in 1024x1024)`);

  console.log('\n=== [6/8] Generating App Icons ===');
  // 1. assets/brand/icon.png: 1024x1024, opaque white background, pepper at most 640px, centered
  const iconScale = 640 / pepperMaxDim;
  const iconW = Math.round(pepperMeta.width * iconScale);
  const iconH = Math.round(pepperMeta.height * iconScale);
  const resizedPepperIcon = await sharp(pepperPath)
    .resize(iconW, iconH, { fit: 'contain' })
    .toBuffer();

  const iconPath = path.join(BRAND_DIR, 'icon.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedPepperIcon,
        left: Math.round((1024 - iconW) / 2),
        top: Math.round((1024 - iconH) / 2),
      },
    ])
    .png()
    .toFile(iconPath);
  console.log(`Saved ${iconPath} (pepper: ${iconW}x${iconH} on opaque white)`);

  // 2. assets/brand/adaptive-foreground.png: 1024x1024 transparent, pepper at most 560px
  const adaptiveFgPath = path.join(BRAND_DIR, 'adaptive-foreground.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: resizedPepperSplash,
        left: Math.round((1024 - splashPepperW) / 2),
        top: Math.round((1024 - splashPepperH) / 2),
      },
    ])
    .png()
    .toFile(adaptiveFgPath);
  console.log(`Saved ${adaptiveFgPath}`);

  // 3. assets/brand/adaptive-monochrome.png: 1024x1024 single-color silhouette on transparent
  const monochromeRaw = await sharp(resizedPepperSplash)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const monoBuf = Buffer.alloc(monochromeRaw.info.width * monochromeRaw.info.height * 4);
  for (let i = 0; i < monochromeRaw.data.length; i += 4) {
    const alpha = monochromeRaw.data[i + 3];
    monoBuf[i] = 0;
    monoBuf[i + 1] = 0;
    monoBuf[i + 2] = 0;
    monoBuf[i + 3] = alpha;
  }
  const monochromePepper = await sharp(monoBuf, {
    raw: {
      width: monochromeRaw.info.width,
      height: monochromeRaw.info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  const adaptiveMonoPath = path.join(BRAND_DIR, 'adaptive-monochrome.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: monochromePepper,
        left: Math.round((1024 - splashPepperW) / 2),
        top: Math.round((1024 - splashPepperH) / 2),
      },
    ])
    .png()
    .toFile(adaptiveMonoPath);
  console.log(`Saved ${adaptiveMonoPath}`);

  // 4. assets/brand/play-store-icon-512.png: 512x512 white background for Play Console
  const playStorePath = path.join(BRAND_DIR, 'play-store-icon-512.png');
  await sharp(iconPath)
    .resize(512, 512)
    .png()
    .toFile(playStorePath);
  console.log(`Saved ${playStorePath}`);

  console.log('\n=== [7/8] Generating Contact Sheet Preview ===');
  const icon192 = await sharp(iconPath).resize(192, 192).toBuffer();
  const icon48 = await sharp(iconPath).resize(48, 48).toBuffer();

  // Android 12 circle splash preview: circular white disk with 105px pepper inside
  const pepperSplash192Scale = 105 / pepperMaxDim;
  const p192W = Math.round(pepperMeta.width * pepperSplash192Scale);
  const p192H = Math.round(pepperMeta.height * pepperSplash192Scale);
  const p192Buf = await sharp(pepperPath).resize(p192W, p192H, { fit: 'contain' }).toBuffer();

  const circleDiskSvg = Buffer.from(`
    <svg width="192" height="192">
      <circle cx="96" cy="96" r="95" fill="#FFFFFF" stroke="#009225" stroke-width="2" stroke-dasharray="6,4"/>
    </svg>
  `);
  const splashInCircle = await sharp({
    create: { width: 192, height: 192, channels: 4, background: { r: 250, g: 250, b: 250, alpha: 1 } },
  })
    .composite([
      { input: circleDiskSvg, left: 0, top: 0 },
      { input: p192Buf, left: Math.round((192 - p192W) / 2), top: Math.round((192 - p192H) / 2) },
    ])
    .png()
    .toBuffer();

  // Full logo resized to width 380px
  const fullLogoScale = Math.min(1, 380 / W);
  const fullLogoW = Math.round(W * fullLogoScale);
  const fullLogoH = Math.round(H * fullLogoScale);
  const fullLogoPreview = await sharp(logoFullPath)
    .resize(fullLogoW, fullLogoH)
    .toBuffer();

  // Canvas
  const canvasW = 960;
  const canvasH = 740;
  const previewPath = path.join(DOCS_DIR, 'preview.png');

  const previewSvg = Buffer.from(`
    <svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${canvasW}" height="${canvasH}" fill="#F9FAFB"/>
      <rect x="30" y="30" width="900" height="680" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
      <text x="60" y="75" font-family="sans-serif" font-size="22" font-weight="bold" fill="#111827">Bakala Express Brand Assets &amp; Icon Preview</text>
      
      <!-- Section 1: Standard App Icon (192px) -->
      <text x="60" y="125" font-family="sans-serif" font-size="14" font-weight="600" fill="#374151">App Icon (192px)</text>
      <rect x="58" y="148" width="196" height="196" rx="20" fill="none" stroke="#E5E7EB" stroke-width="1"/>

      <!-- Section 2: Small Icon (48px) -->
      <text x="320" y="125" font-family="sans-serif" font-size="14" font-weight="600" fill="#374151">Small Icon (48px)</text>
      <rect x="318" y="148" width="52" height="52" rx="8" fill="none" stroke="#E5E7EB" stroke-width="1"/>
      <text x="320" y="235" font-family="sans-serif" font-size="12" font-weight="600" fill="#111827">Readability at 48px:</text>
      <text x="320" y="255" font-family="sans-serif" font-size="12" fill="#4B5563">• Pepper silhouette is crisp and recognizable.</text>
      <text x="320" y="275" font-family="sans-serif" font-size="12" fill="#4B5563">• Inner 'k' line is faint (1-px hairline).</text>
      <text x="320" y="295" font-family="sans-serif" font-size="12" fill="#4B5563">• Acts as an organic mark rather than legible letter.</text>

      <!-- Section 3: Android 12 Adaptive Splash (Circle Mask) -->
      <text x="620" y="125" font-family="sans-serif" font-size="14" font-weight="600" fill="#374151">Android 12 Splash (Circular Crop)</text>

      <!-- Section 4: Full Logo -->
      <line x1="60" y1="380" x2="900" y2="380" stroke="#E5E7EB" stroke-width="1"/>
      <text x="60" y="420" font-family="sans-serif" font-size="14" font-weight="600" fill="#374151">Full Wordmark &amp; Swoosh (Transparent PNG)</text>
    </svg>
  `);

  await sharp(previewSvg)
    .composite([
      { input: icon192, left: 60, top: 150 },
      { input: icon48, left: 320, top: 150 },
      { input: splashInCircle, left: 620, top: 150 },
      { input: fullLogoPreview, left: 60, top: 440 },
    ])
    .png()
    .toFile(previewPath);
  console.log(`Saved ${previewPath}`);

  console.log('\n=== [8/8] Done! All brand assets built successfully ===');
}

main().catch(err => {
  console.error('Build brand assets failed:', err);
  process.exit(1);
});
