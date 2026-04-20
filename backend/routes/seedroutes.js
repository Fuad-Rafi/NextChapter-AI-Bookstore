
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const seedRouter = Router();

// Load books from seed.books.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE_PATH = path.resolve(__dirname, '../../seed.books.json');

let seedBooks = [];
try {
  if (fs.existsSync(SEED_FILE_PATH)) {
    const fileContent = fs.readFileSync(SEED_FILE_PATH, 'utf-8');
    seedBooks = JSON.parse(fileContent);
    // Convert publishedDate strings to Date objects if needed
    seedBooks = seedBooks.map(book => ({
      ...book,
      publishedDate: book.publishedDate ? new Date(book.publishedDate) : undefined,
    }));
  } else {
    console.warn(`Seed file not found at: ${SEED_FILE_PATH}`);
  }
} catch (err) {
  console.error('Failed to load seed.books.json:', err);
}

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
    let upsertedCount = 0;
    for (const book of seedBooks) {
      await Book.findOneAndUpdate(
        { title: book.title, author: book.author },
        book,
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      upsertedCount++;
    }
    res.json({
      success: true,
      message: `Database seeded with ${upsertedCount} books (upserted).`,
      booksUpserted: upsertedCount,
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
