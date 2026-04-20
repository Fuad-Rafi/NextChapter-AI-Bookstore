import mongoose from 'mongoose';
import { mongoDBURL } from './backend/config.js';
import Book from './backend/models/bookmodels.js';
import { resetQdrantCollection } from './backend/services/qdrantService.js';

const reset = async () => {
    await mongoose.connect(mongoDBURL);
    console.log("Connected to Mongo");
    await Book.updateMany({}, { $unset: { embedding: 1, chunkEmbeddings: 1, semanticMetadata: 1 } });
    console.log("Unset embeddings");
    try {
        await resetQdrantCollection();
        console.log("Reset Qdrant collection");
    } catch(e) {
        console.log("Qdrant drop error", e.message);
    }
    process.exit(0);
}
reset();
