import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { logger } from './logger.js';

// 🧩 Ensure environment variables are loaded
dotenv.config();

// ✅ Configure Cloudinary safely
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🧠 Debug logging (optional, remove in production)
logger.debug(`Cloudinary config loaded for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);

// ✅ Named export for use in controllers
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

    // Make sure buffer is valid
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return reject(new Error('Invalid buffer provided to uploadBufferToCloudinary'));
    }

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
