import Order from '../models/ordermodel.js';
import * as embeddingService from './embeddingService.js';
import { getUnifiedVectorSearch } from './vectorSearchService.js';
import { extractPreferenceSignals } from './memoryService.js';

const DEFAULT_RELEVANCE_THRESHOLD = Number(process.env.RAG_RELEVANCE_THRESHOLD ?? 0.3);

const isFiniteNumber = (value) => Number.isFinite(value);

export const classifyQueryIntent = (userQuery = '') => {
  const text = String(userQuery || '').trim();
  const lowered = text.toLowerCase();

  const isGreeting = /^(hi|hello|hey|yo|hola|assalamualaikum|good\s(morning|afternoon|evening))\b/i.test(text);
  const isClarification = /^(what do you mean|can you explain|explain that|i did not understand|what\?)\b/i.test(lowered);
  const isEmpty = text.length === 0;
  const constraints = extractPreferenceSignals(text);

  return {
    isGreeting,
    isClarification,
    isEmpty,
    constraints,
  };
};

export const retrieveRelevantBooks = async ({
  userId,
  userQuery,
  limit = 5,
}) => {
  const query = String(userQuery || '').trim();
  if (!query) {
    return {
      query,
      relevanceThreshold: DEFAULT_RELEVANCE_THRESHOLD,
      retrievedBooks: [],
      constraints: {},
    };
  }

  const constraints = extractPreferenceSignals(query);
  const [orders, queryEmbedding] = await Promise.all([
    Order.find({ customerId: userId }).lean(),
    embeddingService.embedText(query),
  ]);

  const excludeBookIds = new Set(
    orders
      .map((order) => String(order.bookRef || order.bookId || ''))
      .filter(Boolean)
  );

  const vectorFilters = {
    minPrice: isFiniteNumber(constraints.budgetMin) ? constraints.budgetMin : undefined,
    maxPrice: isFiniteNumber(constraints.budgetMax) ? constraints.budgetMax : undefined,
  };

  // Fetch more candidates than requested to allow for divers ranking
  const rawResults = await getUnifiedVectorSearch(queryEmbedding, vectorFilters, Math.max(limit * 6, 30));

  const candidatesWithScores = rawResults
    .filter((book) => !excludeBookIds.has(String(book._id)))
    .map((book) => ({
      ...book,
      relevanceScore: Number(book.semanticScore ?? 0),
    }))
    // Soft thresholding to allow slightly less similar but relevant results
    .filter((book) => Number.isFinite(book.relevanceScore) && book.relevanceScore >= DEFAULT_RELEVANCE_THRESHOLD)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return {
    query,
    relevanceThreshold: DEFAULT_RELEVANCE_THRESHOLD,
    constraints: {
      preferredGenres: constraints.preferredGenres || [],
      dislikedGenres: constraints.dislikedGenres || [],
      preferredAuthors: constraints.preferredAuthors || [],
      budgetMin: constraints.budgetMin,
      budgetMax: constraints.budgetMax,
    },
    retrievedBooks: candidatesWithScores,
  };
};
