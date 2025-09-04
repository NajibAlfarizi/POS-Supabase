import express from 'express';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

export default serverless(app);