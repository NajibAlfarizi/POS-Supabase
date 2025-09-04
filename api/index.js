import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import serverless from 'serverless-http';

import authRoutes from '../server/src/routes/authRoutes.js';
import merekRoutes from '../server/src/routes/merekRoutes.js';
import kategoriBarangRoutes from '../server/src/routes/kategoriBarangRoutes.js';
import sparepartRoutes from '../server/src/routes/sparepartRoutes.js';
import transaksiRoutes from '../server/src/routes/transaksiRoutes.js';
import laporanRoutes from '../server/src/routes/laporanRoutes.js';
import logger from '../server/src/config/logger.js';

const app = express();
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// CORS middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

// Register routes
app.use('/auth', authRoutes);
app.use('/merek', merekRoutes);
app.use('/kategori-barang', kategoriBarangRoutes);
app.use('/sparepart', sparepartRoutes);
app.use('/transaksi', transaksiRoutes);
app.use('/laporan', laporanRoutes);

// Export as serverless function
export default serverless(app);