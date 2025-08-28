import express from 'express';
import { addTransaksi, getTransaksi, getDetailTransaksi, getStrukTransaksi, getRingkasanTransaksi, exportTransaksiCSV, exportTransaksiExcel, getLaporanTransaksi } from '../controllers/transaksiController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ambil semua transaksi
router.get('/', authenticate, getTransaksi);

// Ringkasan transaksi (harian, mingguan, bulanan, filter)
router.get('/ringkasan', authenticate, getRingkasanTransaksi);

// Laporan transaksi detail
router.get('/laporan', authenticate, getLaporanTransaksi);

// Export transaksi
router.get('/export/csv', authenticate, exportTransaksiCSV);
router.get('/export/excel', authenticate, exportTransaksiExcel);

// Ambil detail transaksi by id
router.get('/:id', authenticate, getDetailTransaksi);

// Cetak struk transaksi
router.get('/:id/struk', authenticate, getStrukTransaksi);

// Tambah transaksi (admin/kasir/owner)
router.post('/', authenticate, authorizeRole(['admin', 'owner']), addTransaksi);

export default router;
