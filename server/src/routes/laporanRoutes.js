import express from 'express';
import { getLaporanStatistik } from '../controllers/laporanController.js';
const router = express.Router();

// Statistik laporan

router.get('/statistik', getLaporanStatistik);

export default router;
