import Book from '../models/bookmodels.js';
import * as embeddingService from './embeddingService.js';

/**
 * Get nearest books by semantic similarity to a query embedding
 * @param {number[]} queryEmbedding - The query embedding vector
 * @param {number} limit - Maximum number of books to return
 * @returns {Promise<Array>} - Array of books sorted by semantic similarity
 */
export const getVectorNearestBooks = async (queryEmbedding, limit = 20) => {
  try {
    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      return [];
    }

    // Fetch all books with embeddings
    const books = await Book.find({ embedding: { $exists: true, $ne: null } }).lean();

    if (books.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const resultsWithSimilarity = books
      .map((book) => ({
        ...book,
        semanticScore: embeddingService.cosineSimilarity(queryEmbedding, book.embedding),
      }))
      .sort((a, b) => b.semanticScore - a.semanticScore)
      .slice(0, limit);

    return resultsWithSimilarity;
  } catch (error) {
    console.error('Error in getVectorNearestBooks:', error.message);
    return [];
  }
};

/**
 * Get average embedding of user's liked books (preference profile embedding)
 * @param {string} userId - User ID
 * @returns {Promise<number[]>} - Averaged embedding vector for user preferences
 */
export const aggregateUserPreferenceVector = async (userId) => {
  try {
    if (!userId) {
      return new Array(384).fill(0);
    }

    // Fetch user's liked books
    const likedBooks = await Book.find({
      _id: { $in: [] }, // Would be populated from user.feedbackProfile.likedBookIds
      embedding: { $exists: true, $ne: null },
    }).lean();

    if (likedBooks.length === 0) {
      return new Array(384).fill(0);
    }

    const embeddings = likedBooks.map((book) => book.embedding);
    return embeddingService.averageEmbeddings(embeddings);
  } catch (error) {
    console.error('Error in aggregateUserPreferenceVector:', error.message);
    return new Array(384).fill(0);
  }
};

/**
 * Get books by vector similarity with optional pre-filtering
 * @param {number[]} queryEmbedding - Query embedding
 * @param {Object} filters - Optional filters: { genres: [], minPrice, maxPrice }
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Filtered and sorted books
 */
export const getUnifiedVectorSearch = async (queryEmbedding, filters = {}, limit = 20) => {
  try {
    let query = { embedding: { $exists: true, $ne: null } };

    // Apply filters if provided
    if (filters.genres && filters.genres.length > 0) {
      query.genre = { $in: filters.genres };
    }

    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }

    const books = await Book.find(query).lean();

    if (books.length === 0) {
      return [];
    }

    // Calculate similarity and sort
    const resultsWithSimilarity = books
      .map((book) => ({
        ...book,
        semanticScore: embeddingService.cosineSimilarity(queryEmbedding, book.embedding),
      }))
      .sort((a, b) => b.semanticScore - a.semanticScore)
      .slice(0, limit);

    return resultsWithSimilarity;
  } catch (error) {
    console.error('Error in getUnifiedVectorSearch:', error.message);
    return [];
  }
};

export default {
  getVectorNearestBooks,
  aggregateUserPreferenceVector,
  getUnifiedVectorSearch,
};
