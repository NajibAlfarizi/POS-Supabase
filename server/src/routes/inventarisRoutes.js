import express from 'express';
import { getInventaris, addInventaris, updateInventaris, deleteInventaris, filterInventaris, exportInventarisCSV, getAuditLogInventaris } from '../controllers/inventarisController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ambil semua inventaris (admin/owner)
router.get('/', authenticate, getInventaris);

// Filter & search inventaris
router.get('/search', authenticate, filterInventaris);

// Export inventaris ke CSV
router.get('/export/csv', authenticate, exportInventarisCSV);

// Tambah inventaris (admin/owner)
router.post('/', authenticate, authorizeRole(['admin', 'owner']), addInventaris);

// Update inventaris (admin/owner)
router.put('/:id', authenticate, authorizeRole(['admin', 'owner']), updateInventaris);

// Hapus inventaris (admin/owner)
router.delete('/:id', authenticate, authorizeRole(['admin', 'owner']), deleteInventaris);

// Ambil audit log inventaris
router.get('/audit-log', authenticate, authorizeRole(['admin', 'owner']), getAuditLogInventaris);

export default router;
