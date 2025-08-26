import express from 'express';
import { getInventaris, addInventaris, updateInventaris, deleteInventaris } from '../controllers/inventarisController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ambil semua inventaris (admin/owner)
router.get('/', authenticate, getInventaris);

// Tambah inventaris (admin/owner)
router.post('/', authenticate, authorizeRole(['admin', 'owner']), addInventaris);

// Update inventaris (admin/owner)
router.put('/:id', authenticate, authorizeRole(['admin', 'owner']), updateInventaris);

// Hapus inventaris (admin/owner)
router.delete('/:id', authenticate, authorizeRole(['admin', 'owner']), deleteInventaris);

export default router;
