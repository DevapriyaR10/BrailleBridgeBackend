import multer from 'multer';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import File from '../models/File.js';
import { logger } from '../utils/logger.js';

// 🧠 Use memory storage so we get file.buffer
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// 📤 POST /api/files/upload
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const { buffer, originalname, mimetype, size } = req.file;

    const folder = `braillebridge/originals/${req.user._id}`;
    const public_id = `${Date.now()}-${originalname.replace(/\s+/g, '_')}`;

    logger.debug(`Uploading to Cloudinary: ${originalname} -> folder ${folder}`);

    // Upload buffer to Cloudinary
    const result = await uploadBufferToCloudinary(buffer, {
      folder,
      public_id,
      resource_type: 'auto',
    });

    const fileDoc = await File.create({
      user: req.user._id,
      filename: originalname,
      originalname,
      mimetype,
      size,
      cloudinary_public_id: result.public_id,
      cloudinary_url: result.secure_url,
    });

    logger.info(`File uploaded to Cloudinary: ${result.secure_url}`);
    res.status(201).json(fileDoc);
  } catch (err) {
    logger.error('UploadFile error', err);
    res.status(500).json({ message: 'File upload failed', error: err.message });
  }
};

// 📂 GET /api/files
export const getUserFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    logger.error('getUserFiles error', err);
    res.status(500).json({ message: 'Failed to get files' });
  }
};

// ❌ DELETE /api/files/:id
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found or not authorized' });
    }

    logger.debug(`Deleting Cloudinary file: ${file.cloudinary_public_id}`);
    await deleteFromCloudinary(file.cloudinary_public_id, 'auto');

    await file.deleteOne();

    logger.info(`File deleted: ${file.filename}`);
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    logger.error('deleteFile error', err);
    res.status(500).json({ message: 'File deletion failed', error: err.message });
  }
};
