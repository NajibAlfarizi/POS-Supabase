import express from 'express';
import { getAllSparepart, addSparepart, updateSparepart, deleteSparepart, updateSparepartByTransaksi, getSparepartStatistik, getRiwayatTransaksiSparepart, searchSparepart, getSparepartStokRendah, exportSparepartToExcel } from '../controllers/sparepartController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ambil semua sparepart
router.get('/', authenticate, getAllSparepart);
// Tambah sparepart baru
router.post('/', authenticate, addSparepart);
// Edit sparepart
router.put('/:id', authenticate, updateSparepart);
// Hapus sparepart
router.delete('/:id', authenticate, deleteSparepart);
// Update stok dan penjualan sparepart otomatis berdasarkan transaksi
router.post('/update-by-transaksi', authenticate, updateSparepartByTransaksi);
// Statistik penjualan dan stok sparepart
router.get('/statistik', authenticate, getSparepartStatistik);
// Riwayat transaksi per sparepart
router.get('/:id_sparepart/riwayat-transaksi', authenticate, getRiwayatTransaksiSparepart);
// Search sparepart
router.get('/search', authenticate, searchSparepart);
// Notifikasi stok rendah

router.get('/stok-rendah', authenticate, getSparepartStokRendah);

// Export sparepart ke Excel multi-sheet
router.get('/export-excel', authenticate, exportSparepartToExcel);

export default router;
