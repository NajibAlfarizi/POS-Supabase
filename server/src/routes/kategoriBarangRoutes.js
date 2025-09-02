import express from 'express';
import { getAllKategoriBarang, addKategoriBarang, updateKategoriBarang, deleteKategoriBarang, getSparepartStatByKategori, getMerekByKategori, getPenjualanStatByKategori, searchKategori } from '../controllers/kategoriBarangController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ambil semua kategori barang
router.get('/', authenticate, getAllKategoriBarang);
// Tambah kategori barang baru
router.post('/', authenticate, addKategoriBarang);
// Edit kategori barang
router.put('/:id', authenticate, updateKategoriBarang);
// Hapus kategori barang
router.delete('/:id', authenticate, deleteKategoriBarang);
// Statistik jumlah sparepart per kategori
router.get('/statistik', authenticate, getSparepartStatByKategori);
// Statistik penjualan per kategori
router.get('/statistik-penjualan', authenticate, getPenjualanStatByKategori);
// List merek per kategori
router.get('/:id/merek', authenticate, getMerekByKategori);
// Search/filter kategori barang
router.get('/search', authenticate, searchKategori);

export default router;
