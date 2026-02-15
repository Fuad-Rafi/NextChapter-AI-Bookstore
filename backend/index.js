import express from 'express';
import mongoose from 'mongoose';
import Book from './models/bookmodels.js';
import bookRoutes from './routes/bookrouts.js';
import { mongoDBURL, PORT } from './config.js';
import cors from 'cors';

console.log('Starting server...');
console.log('PORT:', PORT);

const app = express();

console.log('Express app created');

// Middleware to handle CORS - single configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type']
}));

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
  console.log('All good here');
  res.send('Hello, World!');
});

app.use('/books', bookRoutes);

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('Full error:', error);
  });

