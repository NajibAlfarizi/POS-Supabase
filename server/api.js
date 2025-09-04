import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// import authRoutes from './src/routes/authRoutes.js';
// import merekRoutes from './src/routes/merekRoutes.js';
// import kategoriBarangRoutes from './src/routes/kategoriBarangRoutes.js';
// import sparepartRoutes from './src/routes/sparepartRoutes.js';
// import transaksiRoutes from './src/routes/transaksiRoutes.js';
// import laporanRoutes from './src/routes/laporanRoutes.js';

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
        ],
    })
);
app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

export default serverless(app);
