import express from 'express';
import mongoose from 'mongoose';
import bookRoutes from './routes/bookrouts.js';
import authRoutes from './routes/authroutes.js';
import orderRoutes from './routes/orderroutes.js';
import { mongoDBURL, PORT } from './config.js';
import cors from 'cors';

const app = express();

const localOrigins = ['http://localhost:5173', 'http://localhost:5000'];
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...localOrigins, ...envOrigins])];

// Middleware to handle CORS - single configuration
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  console.log('All good here');
  res.send('Hello, World!');
});

let cachedConnection = global.mongooseConnection;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  cachedConnection = await mongoose.connect(mongoDBURL);
  global.mongooseConnection = cachedConnection;
  return cachedConnection;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

app.use('/books', bookRoutes);
app.use('/auth', authRoutes);
app.use('/orders', orderRoutes);

if (process.env.VERCEL !== '1') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error.message);
    });
}

export default app;

