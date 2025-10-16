import express from 'express';
import { convertToBrailleController, convertToSpeechController } from '../controllers/convertController.js';
import { protect } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// 🧠 Debug every conversion request
router.use((req, res, next) => {
  logger.debug(`[CONVERT ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

// ♿ Convert to Braille
router.get('/braille/:id', protect, convertToBrailleController);

// 🔊 Convert to Speech
router.get('/tts/:id', protect, convertToSpeechController);

export default router;
