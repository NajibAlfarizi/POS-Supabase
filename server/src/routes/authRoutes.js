import express from 'express';
import { login, addAdmin } from '../controllers/authController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Login route (public)
router.post('/login', login);

// Owner: tambah admin (hanya bisa diakses owner)
router.post('/add-admin', authenticate, authorizeRole('owner'), addAdmin);

export default router;
