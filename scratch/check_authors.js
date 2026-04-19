import mongoose from 'mongoose';
import Book from '../backend/models/bookmodels.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/mern-book-store';

async function checkBooks() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    const authors = ['Iris Moore', 'Nina Hale', 'Humayun Ahmed'];
    
    for (const authorName of authors) {
      const books = await Book.find({ 
        author: { $regex: new RegExp(authorName, 'i') } 
      }).lean();
      
      console.log(`Author: "${authorName}"`);
      console.log(`Found ${books.length} books`);
      if (books.length > 0) {
        books.forEach(b => {
          console.log(` - Title: "${b.title}", Genre: "${b.genre}", Has Embedding: ${!!b.embedding}, Embedding Length: ${b.embedding?.length || 0}`);
        });
      }
      console.log('---');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkBooks();
