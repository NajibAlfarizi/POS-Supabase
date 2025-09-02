import express from 'express';
import { getAllMerek, addMerek, updateMerek, deleteMerek, getSparepartStatByMerek, getKategoriBarangByMerek, getPenjualanStatByMerek, searchMerek } from '../controllers/merekController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ambil semua merek
router.get('/', authenticate, getAllMerek);
// Tambah merek baru
router.post('/', authenticate, addMerek);
// Edit merek
router.put('/:id', authenticate, updateMerek);
// Hapus merek
router.delete('/:id', authenticate, deleteMerek);
// Statistik jumlah sparepart per merek dan breakdown per kategori
router.get('/statistik', authenticate, getSparepartStatByMerek);
// List kategori barang per merek
router.get('/:id/kategori-barang', authenticate, getKategoriBarangByMerek);
// Statistik penjualan per merek
router.get('/statistik-penjualan', authenticate, getPenjualanStatByMerek);
// Filter & search merek
router.get('/search', authenticate, searchMerek);

export default router;
