import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const BUCKET_NAME = env.SUPABASE_STORAGE_BUCKET || 'issue-images';

/**
 * Ensures the private storage bucket exists.
 */
export async function ensureStorageBucket() {
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (!error && buckets) {
      const exists = buckets.some((b) => b.name === BUCKET_NAME);
      if (!exists) {
        await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: false,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });
        logger.info({ bucket: BUCKET_NAME }, 'Created private storage bucket');
      }
    }
  } catch (err) {
    logger.warn({ error: err.message }, 'Storage bucket check completed with notice');
  }
}

/**
 * Uploads a sanitized image buffer to the private Supabase storage bucket.
 * @param {string} userId
 * @param {string} reportId
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<string>} stored object path
 */
export async function uploadReportImage(userId, reportId, buffer, mimeType = 'image/webp') {
  const filePath = `${userId}/${reportId}.webp`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    logger.error({ error: error.message, filePath }, 'Failed to upload report image to Supabase Storage');
    throw error;
  }

  return filePath;
}

/**
 * Generates a short-lived (60s) signed URL for an image path after authorization check.
 * @param {string} imagePath
 * @param {number} expiresInSeconds
 * @returns {Promise<string|null>}
 */
export async function getSignedImageUrl(imagePath, expiresInSeconds = 60) {
  if (!imagePath) return null;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(imagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      logger.warn({ error: error?.message, imagePath }, 'Failed to create signed URL');
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    logger.error({ error: err.message, imagePath }, 'Error generating signed URL');
    return null;
  }
}
