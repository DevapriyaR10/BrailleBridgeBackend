import express from 'express';
import { upload, uploadFile, getUserFiles } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// 🧠 Debug every file-related request
router.use((req, res, next) => {
  logger.debug(`[FILE ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

// 📤 Upload file (authenticated)
router.post('/upload', protect, upload.single('file'), uploadFile);

// 📂 Get all files for a user
router.get('/', protect, getUserFiles);

export default router;
