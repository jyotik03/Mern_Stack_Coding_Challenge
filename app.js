// app.js
import express from 'express';
import mongoose from 'mongoose';
import transactionsRoutes from './routes/transactions.js';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mern-api', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Use the transactions route
app.use('/api/transactions', transactionsRoutes);

// Fallback route for serving the frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
