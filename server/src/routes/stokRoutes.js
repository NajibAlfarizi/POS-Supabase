import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getRiwayatStok, stokMasuk, stokKeluar, stokPenyesuaian, getTipeTransaksiStok } from '../controllers/stokController.js';

const router = express.Router();

// Ambil riwayat stok per inventaris
router.get('/riwayat/:id_inventaris', authenticate, getRiwayatStok);

// Pencatatan stok masuk
router.post('/masuk', authenticate, stokMasuk);

// Pencatatan stok keluar
router.post('/keluar', authenticate, stokKeluar);

// Pencatatan penyesuaian stok
router.post('/penyesuaian', authenticate, stokPenyesuaian);

// Ambil tipe transaksi stok (untuk frontend)
router.get('/tipe', authenticate, getTipeTransaksiStok);

export default router;
