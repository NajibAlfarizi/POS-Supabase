import express from 'express';
import { getKategori, addKategori, updateKategori, deleteKategori, getAuditLogKategori } from '../controllers/kategoriController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ambil semua kategori (admin/owner)
router.get('/', authenticate, getKategori);

// Ambil audit log kategori beserta nama user (admin/owner)
router.get('/audit-log', authenticate, authorizeRole(['admin', 'owner']), getAuditLogKategori);

// Tambah kategori (admin/owner)
router.post('/', authenticate, authorizeRole(['admin', 'owner']), addKategori);

// Update kategori (admin/owner)
router.put('/:id', authenticate, authorizeRole(['admin', 'owner']), updateKategori);

// Hapus kategori (admin/owner)
router.delete('/:id', authenticate, authorizeRole(['admin', 'owner']), deleteKategori);

export default router;
