import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';

import authRoutes from './routes/authRoutes.js';
import merekRoutes from './routes/merekRoutes.js';
import kategoriBarangRoutes from './routes/kategoriBarangRoutes.js';
import sparepartRoutes from './routes/sparepartRoutes.js';
import transaksiRoutes from './routes/transaksiRoutes.js';
import laporanRoutes from './routes/laporanRoutes.js';
import logger from './config/logger.js';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  })
);

// Routes
app.use('/auth', authRoutes);
app.use('/merek', merekRoutes);
app.use('/kategori-barang', kategoriBarangRoutes);
app.use('/sparepart', sparepartRoutes);
app.use('/transaksi', transaksiRoutes);
app.use('/laporan', laporanRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});