import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { logger } from './logger.js';

// 🧩 Ensure environment variables are loaded
dotenv.config();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🧠 Debug logging (optional)
logger.debug(`Cloudinary config loaded for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);

// ✅ Upload file buffer to Cloudinary
export const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        logger.error('❌ Cloudinary upload error:', {
          message: error.message,
          http_code: error.http_code,
          name: error.name,
        });
        return reject(error);
      }

      logger.info(`✅ Cloudinary upload success: ${result.secure_url}`);
      resolve(result);
    });

    if (!buffer || !Buffer.isBuffer(buffer)) {
      return reject(new Error('Invalid buffer provided to uploadBufferToCloudinary'));
    }

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

// 🧹 Delete file from Cloudinary
export const deleteFromCloudinary = async (public_id, resource_type = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, { resource_type });
    logger.info(`🗑️ Deleted from Cloudinary: ${public_id}`);
    return result;
  } catch (error) {
    logger.error('❌ Error deleting from Cloudinary:', error);
    throw error;
  }
};
