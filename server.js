// -----------------------------------------------------------
// Load environment variables FIRST
// -----------------------------------------------------------
import dotenv from 'dotenv';
dotenv.config(); // ✅ must be before importing any config files

// -----------------------------------------------------------
// Core dependencies
// -----------------------------------------------------------
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// -----------------------------------------------------------
// Local imports (these rely on process.env variables)
// -----------------------------------------------------------
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import convertRoutes from './routes/convertRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';

// -----------------------------------------------------------
// Connect to database
// -----------------------------------------------------------
connectDB();

// -----------------------------------------------------------
// Initialize Express app
// -----------------------------------------------------------
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// -----------------------------------------------------------
// Routes
// -----------------------------------------------------------
app.get('/', (req, res) => res.send('BrailleBridge API running...'));
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/convert', convertRoutes);

// -----------------------------------------------------------
// Error handling middleware
// -----------------------------------------------------------
app.use(errorHandler);

// -----------------------------------------------------------
// Start server
// -----------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`✅ Server running on port ${PORT}`));
