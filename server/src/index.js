import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import authRoutes from './routes/authRoutes.js';
import inventarisRoutes from './routes/inventarisRoutes.js';
import kategoriRoutes from './routes/kategoriRoutes.js';
import stokRoutes from './routes/stokRoutes.js';
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

// Register inventaris routes
app.use('/inventaris', inventarisRoutes);

// Register kategori routes
app.use('/kategori', kategoriRoutes);

// Register stok routes
app.use('/stok', stokRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
