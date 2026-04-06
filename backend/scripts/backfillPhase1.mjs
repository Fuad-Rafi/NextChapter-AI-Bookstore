import mongoose from 'mongoose';
import { mongoDBURL } from '../config.js';
import Book from '../models/bookmodels.js';
import User from '../models/usermodel.js';
import { normalizeAssistantMemory, normalizeUserPreferences } from '../utils/ragData.js';

const backfillBooks = async () => {
  const books = await Book.find({});
  let updated = 0;

  for (const book of books) {
    let changed = false;

    if (typeof book.description !== 'string') {
      book.description = '';
      changed = true;
    }

    const preferredSynopsis = typeof book.synopsis === 'string' ? book.synopsis.trim() : '';
    const fallbackSynopsis = typeof book.description === 'string' ? book.description.trim() : '';
    const resolvedSynopsis = preferredSynopsis || fallbackSynopsis;

    if (book.synopsis !== resolvedSynopsis) {
      book.synopsis = resolvedSynopsis;
      changed = true;
    }

    if (typeof book.genre !== 'string') {
      book.genre = '';
      changed = true;
    }

    if (!Array.isArray(book.tags)) {
      book.tags = [];
      changed = true;
    }

    if (!Array.isArray(book.themes)) {
      book.themes = [];
      changed = true;
    }

    if (!Array.isArray(book.subjects)) {
      book.subjects = [];
      changed = true;
    }

    if (typeof book.language !== 'string') {
      book.language = '';
      changed = true;
    }

    if (typeof book.audience !== 'string') {
      book.audience = '';
      changed = true;
    }

    if (typeof book.price === 'number') {
      const clampedPrice = Math.min(700, Math.max(200, book.price));
      if (book.price !== clampedPrice) {
        book.price = clampedPrice;
        changed = true;
      }
    } else if (book.price !== null) {
      book.price = 200;
      changed = true;
    }

    if (typeof book.isPublished !== 'boolean') {
      book.isPublished = true;
      changed = true;
    }

    if (book.rating === undefined) {
      book.rating = null;
      changed = true;
    }

    if (changed) {
      await book.save();
      updated += 1;
    }
  }

  return updated;
};

const backfillUsers = async () => {
  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    const normalizedPreferences = normalizeUserPreferences(user.preferences || {});
    const normalizedAssistantMemory = normalizeAssistantMemory(user.assistantMemory || {});
    const profileNotes = typeof user.profileNotes === 'string' ? user.profileNotes.trim() : '';

    const sameData =
      JSON.stringify(user.preferences || {}) === JSON.stringify(normalizedPreferences)
      && JSON.stringify(user.assistantMemory || {}) === JSON.stringify(normalizedAssistantMemory)
      && profileNotes === (user.profileNotes || '');

    if (sameData) {
      continue;
    }

    user.preferences = normalizedPreferences;
    user.assistantMemory = normalizedAssistantMemory;
    user.profileNotes = profileNotes;
    await user.save();
    updated += 1;
  }

  return updated;
};

const run = async () => {
  try {
    await mongoose.connect(mongoDBURL);
    const updatedBooks = await backfillBooks();
    const updatedUsers = await backfillUsers();

    console.log(`Backfill completed: ${updatedBooks} books updated, ${updatedUsers} users updated.`);
  } catch (error) {
    console.error('Backfill failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
