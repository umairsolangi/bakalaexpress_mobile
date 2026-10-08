import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import {
  isAllowedImageType,
  processImageForUpload,
  cleanupTempFiles,
  buildFilePart,
  MAX_IMAGE_BYTES,
  ImageValidationError,
} from '../image';

// Mocks
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('Image Utility (src/utils/image.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAllowedImageType', () => {
    it('accepts valid JPEG and PNG types and extensions', () => {
      expect(isAllowedImageType('image/jpeg')).toBe(true);
      expect(isAllowedImageType('image/png')).toBe(true);
      expect(isAllowedImageType('photo.jpg')).toBe(true);
      expect(isAllowedImageType('photo.PNG')).toBe(true);
    });

    it('rejects unsupported types like GIF, WEBP, or PDF', () => {
      expect(isAllowedImageType('image/gif')).toBe(false);
      expect(isAllowedImageType('image/webp')).toBe(false);
      expect(isAllowedImageType('doc.pdf')).toBe(false);
    });
  });

  describe('buildFilePart', () => {
    it('formats file object for React Native FormData correctly', () => {
      const part = buildFilePart('file:///path/to/img.jpg', 'doc.jpg', 'image/jpeg');
      expect(part).toEqual({
        uri: 'file:///path/to/img.jpg',
        name: 'doc.jpg',
        type: 'image/jpeg',
      });
    });
  });

  describe('processImageForUpload', () => {
    it('throws error on unsupported image type', async () => {
      await expect(
        processImageForUpload({
          uri: 'file:///path/to/anim.gif',
          type: 'image/gif',
        })
      ).rejects.toThrow(ImageValidationError);
    });

    it('compresses and returns processed image when within size limit on first try', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        uri: 'file:///cache/manip_1.jpg',
        width: 1600,
        height: 1200,
      });

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
        size: 500 * 1024, // 500 KB < 2MB
      });

      const result = await processImageForUpload({
        uri: 'file:///original.jpg',
        width: 3200,
        height: 2400,
        type: 'image/jpeg',
      });

      expect(result.uri).toBe('file:///cache/manip_1.jpg');
      expect(result.size).toBe(500 * 1024);
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file:///original.jpg',
        [{ resize: { width: 1600 } }],
        { compress: 0.7, format: 'jpeg' }
      );
    });

    it('steps down quality if first compressed image exceeds size limit', async () => {
      // First attempt at 0.7 is 2.5 MB (too big)
      (ImageManipulator.manipulateAsync as jest.Mock)
        .mockResolvedValueOnce({
          uri: 'file:///cache/manip_heavy.jpg',
          width: 1600,
          height: 1200,
        })
        // Second attempt at 0.5 is 1.2 MB (valid!)
        .mockResolvedValueOnce({
          uri: 'file:///cache/manip_valid.jpg',
          width: 1600,
          height: 1200,
        });

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true, size: 2.5 * 1024 * 1024 })
        .mockResolvedValueOnce({ exists: true, size: 1.2 * 1024 * 1024 });

      const result = await processImageForUpload({
        uri: 'file:///original.jpg',
        width: 1600,
        height: 1200,
        type: 'image/jpeg',
      });

      expect(result.uri).toBe('file:///cache/manip_valid.jpg');
      expect(result.size).toBe(1.2 * 1024 * 1024);
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledTimes(2);
    });

    it('throws error and cleans up file if image exceeds limit on all quality steps', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: 'file:///cache/manip_oversized.jpg',
      });

      // Always 3 MB (exceeds 2 MB limit)
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 3 * 1024 * 1024,
      });

      await expect(
        processImageForUpload({
          uri: 'file:///massive.jpg',
          type: 'image/jpeg',
        })
      ).rejects.toThrow('The image file is too large');

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        'file:///cache/manip_oversized.jpg',
        { idempotent: true }
      );
    });
  });

  describe('cleanupTempFiles', () => {
    it('calls FileSystem.deleteAsync for each valid uri', async () => {
      await cleanupTempFiles([
        'file:///cache/img1.jpg',
        null,
        'file:///cache/img2.jpg',
        undefined,
      ]);

      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///cache/img1.jpg', {
        idempotent: true,
      });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///cache/img2.jpg', {
        idempotent: true,
      });
    });
  });
});
