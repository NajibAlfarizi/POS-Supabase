import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
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

// Body parser hanya untuk route POST/PUT
app.use(express.json());

export default serverless(app);