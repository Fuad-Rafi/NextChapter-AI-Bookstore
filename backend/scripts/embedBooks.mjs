import mongoose from 'mongoose';
import { mongoDBURL } from '../config.js';
import Book from '../models/bookmodels.js';
import * as embeddingService from '../services/embeddingService.js';

const EMBEDDING_MODEL_VERSION = 'Xenova/all-MiniLM-L6-v2';

const embedBooks = async () => {
  try {
    console.log('🚀 Starting book embedding process...');
    console.log(`📚 Model: ${EMBEDDING_MODEL_VERSION}`);

    // Connect to database
    await mongoose.connect(mongoDBURL);
    console.log('✅ Connected to MongoDB');

    // Get all books without embeddings
    const books = await Book.find({ embedding: { $exists: false } });
    console.log(`📖 Found ${books.length} books to embed`);

    if (books.length === 0) {
      console.log('ℹ️  All books already have embeddings!');
      await mongoose.disconnect();
      return;
    }

    let embeddedCount = 0;
    let failedCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < books.length; i++) {
      const book = books[i];

      try {
        // Build search text from book metadata
        const searchText = [
          book.title,
          book.author,
          book.synopsis || book.description || '',
          book.genre,
          ...(Array.isArray(book.tags) ? book.tags : []),
          ...(Array.isArray(book.themes) ? book.themes : []),
          ...(Array.isArray(book.subjects) ? book.subjects : []),
        ]
          .filter(Boolean)
          .join(' ');

        // Generate embedding
        const embedding = await embeddingService.embedText(searchText);

        // Update book with embedding
        const updated = await Book.findByIdAndUpdate(
          book._id,
          {
            embedding,
            semanticMetadata: {
              embeddedAt: new Date(),
              modelVersion: EMBEDDING_MODEL_VERSION,
            },
          },
          { new: true }
        );

        embeddedCount++;

        // Log progress every 5 books
        if ((i + 1) % 5 === 0 || i === books.length - 1) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const rate = embeddedCount / (elapsed || 1);
          console.log(
            `⏳ Progress: ${i + 1}/${books.length} embedded | ${rate.toFixed(1)} books/sec | Time: ${elapsed}s`
          );
        }
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to embed book "${book.title}":`, error.message);
      }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✨ Embedding complete!`);
    console.log(`✅ Successfully embedded: ${embeddedCount} books`);
    console.log(`❌ Failed: ${failedCount} books`);
    console.log(`⏱️  Total time: ${totalTime}s`);

    if (embeddedCount > 0) {
      console.log(`📊 Avg: ${(totalTime / embeddedCount).toFixed(2)}s per book`);
    }

    // Verify embeddings
    const embeddedBooks = await Book.countDocuments({ embedding: { $exists: true, $ne: null } });
    console.log(`📈 Total books with embeddings: ${embeddedBooks}`);
  } catch (error) {
    console.error('💥 Fatal error during embedding:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

embedBooks();
