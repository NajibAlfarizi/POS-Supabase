import express from 'express';
import * as transaksiController from '../controllers/transaksiController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ambil semua transaksi (dengan filter)
router.get('/', authenticate, transaksiController.getTransaksi);
// Tambah transaksi baru
router.post('/', authenticate, transaksiController.addTransaksi);
// Update transaksi
router.put('/:id', authenticate, transaksiController.updateTransaksi);
// Hapus transaksi
router.delete('/:id', authenticate, transaksiController.deleteTransaksi);
// Detail transaksi

// Ringkasan transaksi
router.get('/ringkasan', authenticate, transaksiController.getRingkasanTransaksi);
// Export transaksi ke CSV
router.get('/export/csv', authenticate, transaksiController.exportTransaksiCSV);
// Export transaksi ke Excel
router.get('/export/excel', authenticate, transaksiController.exportTransaksiExcel);
// Detail transaksi
router.get('/:id', authenticate, transaksiController.getDetailTransaksi);

export default router;
