import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import authRoutes from './routes/authRoutes.js';
import logger from './config/logger.js';

const app = express();
app.use(express.json());

// Middleware logging dengan Winston
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Register auth routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
