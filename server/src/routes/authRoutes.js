import express from 'express';
import { login, addAdmin, refreshToken } from '../controllers/authController.js';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Login route (public)
router.post('/login', login);

// Refresh token route (public)
router.post('/refresh', refreshToken);

// Owner: tambah admin (hanya bisa diakses owner)
router.post('/add-admin', authenticate, authorizeRole('owner'), addAdmin);

export default router;
