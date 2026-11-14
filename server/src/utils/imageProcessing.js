import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates image magic bytes and resizes/sanitizes with sharp.
 * Strips EXIF/GPS metadata and normalizes dimensions.
 * @param {Buffer} buffer 
 * @returns {Promise<{ sanitizedBuffer: Buffer, mimeType: string, base64: string, width: number, height: number }>}
 */
export async function sanitizeAndProcessImage(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Image buffer is empty');
  }

  // Magic bytes check
  const detectedType = await fileTypeFromBuffer(buffer);
  if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
    const error = new Error('Invalid image format. Allowed formats: JPEG, PNG, WebP.');
    error.statusCode = 400;
    error.code = 'INVALID_IMAGE_TYPE';
    throw error;
  }

  // Max 5 MB check
  if (buffer.length > 5 * 1024 * 1024) {
    const error = new Error('Image size exceeds 5 MB limit.');
    error.statusCode = 400;
    error.code = 'IMAGE_TOO_LARGE';
    throw error;
  }

  // Process with Sharp: strip metadata, resize to max 1600px on long edge, convert to webp
  const image = sharp(buffer, { failOn: 'none' }).rotate(); // auto-orient based on EXIF before stripping
  const metadata = await image.metadata();

  const sanitizedBuffer = await image
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

  const finalMetadata = await sharp(sanitizedBuffer).metadata();

  return {
    sanitizedBuffer,
    mimeType: 'image/webp',
    base64: sanitizedBuffer.toString('base64'),
    width: finalMetadata.width || metadata.width || 800,
    height: finalMetadata.height || metadata.height || 600,
  };
}
