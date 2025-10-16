import express from 'express';
import { registerUser, authUser } from '../controllers/authController.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// 🧠 Debug middleware — log every auth request
router.use((req, res, next) => {
  logger.debug(`[AUTH ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

// 📝 Routes
router.post('/register', registerUser);
router.post('/login', authUser);

export default router;
