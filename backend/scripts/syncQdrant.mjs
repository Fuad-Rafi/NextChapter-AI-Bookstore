import mongoose from 'mongoose';
import { mongoDBURL } from '../config.js';
import Book from '../models/bookmodels.js';
import { ensureQdrantCollection, upsertBookPoint } from '../services/qdrantService.js';

const syncQdrant = async () => {
  let synced = 0;
  let failed = 0;

  try {
    await mongoose.connect(mongoDBURL);
    console.log('Connected to MongoDB');

    const collectionReady = await ensureQdrantCollection();
    if (!collectionReady) {
      console.log('Qdrant is disabled. Enable QDRANT_ENABLED=1 and set QDRANT_URL to sync.');
      return;
    }

    const books = await Book.find({ embedding: { $exists: true, $ne: null } }).lean();
    console.log(`Found ${books.length} embedded books to sync`);

    for (const book of books) {
      try {
        await upsertBookPoint(book);
        synced += 1;
      } catch (error) {
        failed += 1;
        console.error(`Failed to sync ${book.title}: ${error.message}`);
      }
    }

    console.log(`Qdrant sync completed. Synced=${synced}, Failed=${failed}`);
  } catch (error) {
    console.error(`Qdrant sync failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

syncQdrant();
