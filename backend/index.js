import express from 'express';
import mongoose from 'mongoose';
import bookRoutes from './routes/bookrouts.js';
import authRoutes from './routes/authroutes.js';
import orderRoutes from './routes/orderroutes.js';
import recommendationRoutes from './routes/bookrecommendations.js';
import assistantChatRoutes from './routes/assistantchat.js';
import { mongoDBURL, PORT, validateEnvironment } from './config.js';
import { safeLogError } from './utils/securityLogger.js';
import cors from 'cors';

const app = express();

validateEnvironment();

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
    safeLogError('Database connection failure', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

app.use('/books/recommendations', recommendationRoutes);
app.use('/books', bookRoutes);
app.use('/assistant', assistantChatRoutes);
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
      safeLogError('Error connecting to MongoDB', error);
    });
}

export default app;

