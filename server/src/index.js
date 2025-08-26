import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import authRoutes from './routes/authRoutes.js';

const app = express();
app.use(express.json());

// Register auth routes
app.use('/auth', authRoutes);
app.get('/', (req, res) => {
  res.send('POS Supabase Express API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
