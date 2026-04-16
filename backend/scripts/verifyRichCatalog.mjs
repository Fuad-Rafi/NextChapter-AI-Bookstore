import mongoose from 'mongoose';
import { mongoDBURL } from '../config.js';
import Book from '../models/bookmodels.js';

const run = async () => {
  try {
    await mongoose.connect(mongoDBURL);

    const count = await Book.countDocuments({});
    const embedded = await Book.countDocuments({ embedding: { $exists: true, $ne: null } });
    const samples = await Book.find({})
      .select('title genre author synopsis')
      .limit(3)
      .lean();

    console.log(JSON.stringify({ count, embedded, samples }, null, 2));
  } catch (error) {
    console.error(`Verification failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();