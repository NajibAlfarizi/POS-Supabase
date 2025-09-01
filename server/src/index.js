import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors'

import express from 'express';
import authRoutes from './routes/authRoutes.js';
import merekRoutes from './routes/merekRoutes.js';
import kategoriBarangRoutes from './routes/kategoriBarangRoutes.js';
import sparepartRoutes from './routes/sparepartRoutes.js';
import transaksiRoutes from './routes/transaksiRoutes.js';
import logger from './config/logger.js';

const app = express();
app.use(express.json());

// Middleware logging dengan Winston
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors());

// Register auth routes
app.use('/auth', authRoutes);

// register merek routes
app.use('/merek', merekRoutes);

// register kategori barang routes
app.use('/kategori-barang', kategoriBarangRoutes);

// register sparepart routes
app.use('/sparepart', sparepartRoutes);

// register transaksi routes
app.use('/transaksi', transaksiRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
