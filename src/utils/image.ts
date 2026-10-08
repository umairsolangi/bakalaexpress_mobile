import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export const MAX_IMAGE_BYTES = 2048 * 1024; // 2MB backend max limit
export const MAX_LONG_SIDE = 1600;
export const QUALITY_STEPS = [0.7, 0.5, 0.35];
export const RESIZE_DIMENSIONS = [1600, 1200, 900];

export interface ProcessedImage {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface ImageInputMeta {
  uri: string;
  type?: string;
  width?: number;
  height?: number;
  fileName?: string;
}

export class ImageValidationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ImageValidationError';
    this.code = code;
    Object.setPrototypeOf(this, ImageValidationError.prototype);
  }
}

/**
 * Validates that an image is JPEG, PNG, or WEBP.
 */
export function isAllowedImageType(mimeOrUri: string): boolean {
  const lower = mimeOrUri.toLowerCase();
  return (
    lower.includes('jpeg') ||
    lower.includes('jpg') ||
    lower.includes('png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png')
  );
}

/**
 * Resizes image and compresses with dimension downscaling and step fallback
 * to guarantee stay under 2MB limit for any camera photo.
 */
export async function processImageForUpload(
  meta: ImageInputMeta
): Promise<ProcessedImage> {
  const { uri, type, width, height, fileName } = meta;

  if (type && !isAllowedImageType(type)) {
    throw new ImageValidationError(
      'INVALID_TYPE',
      'Only JPEG and PNG images are allowed.'
    );
  }

  const generatedName =
    fileName || `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

  let lastProcessedUri: string | null = null;
  let lastSize = 0;

  for (const maxDim of RESIZE_DIMENSIONS) {
    // Calculate resize action for target max dimension
    const actions: ImageManipulator.Action[] = [];
    if (width && height) {
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          actions.push({ resize: { width: maxDim } });
        } else {
          actions.push({ resize: { height: maxDim } });
        }
      }
    } else {
      actions.push({ resize: { width: maxDim } });
    }

    for (const quality of QUALITY_STEPS) {
      const manipResult = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      // Clean up previous temporary candidate if new one was produced
      if (lastProcessedUri && lastProcessedUri !== manipResult.uri) {
        try {
          await FileSystem.deleteAsync(lastProcessedUri, { idempotent: true });
        } catch {
          // Ignore
        }
      }

      lastProcessedUri = manipResult.uri;

      try {
        const fileInfo = await FileSystem.getInfoAsync(manipResult.uri);
        lastSize = (fileInfo as any).size ?? 0;
      } catch {
        lastSize = 0;
      }

      if (lastSize <= MAX_IMAGE_BYTES) {
        return {
          uri: manipResult.uri,
          name: generatedName,
          type: 'image/jpeg',
          size: lastSize,
        };
      }
    }
  }

  // Still too large even after all quality & dimension reduction steps
  if (lastProcessedUri) {
    try {
      await FileSystem.deleteAsync(lastProcessedUri, { idempotent: true });
    } catch {
      // Ignore cleanup error
    }
  }

  throw new ImageValidationError(
    'IMAGE_TOO_LARGE',
    'The image file is too large. Please select a smaller photo or retake.'
  );
}

/**
 * Delete temporary processed files from cache.
 * Silently catches errors.
 */
export async function cleanupTempFiles(
  uris: Array<string | null | undefined>
): Promise<void> {
  for (const uri of uris) {
    if (uri && typeof uri === 'string') {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch {
        // Silently ignore cleanup errors
      }
    }
  }
}

/**
 * Formats a file object for React Native FormData:
 * { uri, name, type }
 */
export function buildFilePart(
  uri: string,
  name: string = 'photo.jpg',
  type: string = 'image/jpeg'
): { uri: string; name: string; type: string } {
  let cleanUri = uri;
  if (
    !cleanUri.startsWith('file://') &&
    !cleanUri.startsWith('content://') &&
    !cleanUri.startsWith('ph://') &&
    !cleanUri.startsWith('http://') &&
    !cleanUri.startsWith('https://')
  ) {
    cleanUri = `file://${cleanUri}`;
  }
  return {
    uri: cleanUri,
    name,
    type,
  };
}

/**
 * Creates a file part for FormData.
 * Uses the canonical React Native file object { uri, name, type },
 * which is natively supported by React Native and avoids Hermes File.name getter errors.
 */
export async function createFormDataFilePart(
  uri: string,
  name: string = 'photo.jpg',
  type: string = 'image/jpeg'
): Promise<any> {
  return buildFilePart(uri, name, type);
}

/**
 * Appends a file part to FormData.
 */
export function appendFormDataFile(
  formData: FormData,
  key: string,
  filePart: any,
  _fileName: string = 'photo.jpg'
): void {
  formData.append(key, filePart as any);
}
