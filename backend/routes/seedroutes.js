import { Router } from 'express';
import Book from '../models/bookmodels.js';

const seedRouter = Router();

// Seed data
const seedBooks = [
  {
    title: 'The Silent Cipher',
    author: 'Nina Hale',
    description: 'A fast-paced mystery about a journalist uncovering a decades-old secret network.',
    genre: 'Mystery',
    tags: ['investigation', 'thriller', 'fast-paced'],
    themes: ['truth', 'betrayal'],
    subjects: ['journalism', 'crime'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('2022-04-11'),
    price: 240,
    rating: 4.5,
    isPublished: true,
  },
  {
    title: 'Summer at Fern Lake',
    author: 'Iris Moore',
    description: 'A warm contemporary romance set in a quiet lakeside town.',
    genre: 'Romance',
    tags: ['small-town', 'feel-good'],
    themes: ['healing', 'second chances'],
    subjects: ['relationships'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('2021-06-20'),
    price: 210,
    rating: 4.1,
    isPublished: true,
  },
  {
    title: 'Orbit of Ashes',
    author: 'K. R. Solis',
    description: 'A political science fiction epic where factions battle for control of a dying star system.',
    genre: 'Science Fiction',
    tags: ['space opera', 'epic'],
    themes: ['power', 'survival'],
    subjects: ['space', 'politics'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('2020-09-01'),
    price: 320,
    rating: 4.7,
    isPublished: true,
  },
];

// Middleware to verify seed token
const verifySeedToken = (req, res, next) => {
  const token = req.headers['x-seed-token'];
  const expectedToken = process.env.SEED_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({ error: 'SEED_TOKEN not configured' });
  }

  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Invalid or missing seed token' });
  }

  next();
};

// Seed database endpoint
seedRouter.post('/seed-database', verifySeedToken, async (req, res) => {
  try {
    // Clear existing books (optional - comment out if you want to append)
    const deleteResult = await Book.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} books`);

    // Insert new books
    const result = await Book.insertMany(seedBooks);
    res.json({
      success: true,
      message: `Database seeded with ${result.length} books`,
      booksInserted: result.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      error: 'Failed to seed database',
      message: error.message,
    });
  }
});

// Health check endpoint (optional)
seedRouter.get('/seed-status', (req, res) => {
  res.json({ status: 'Seed API ready' });
});

export default seedRouter;
