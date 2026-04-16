import Order from '../models/ordermodel.js';
import * as embeddingService from './embeddingService.js';
import { getUnifiedVectorSearch } from './vectorSearchService.js';
import { extractPreferenceSignals } from './memoryService.js';

const DEFAULT_RELEVANCE_THRESHOLD = Number(process.env.RAG_RELEVANCE_THRESHOLD ?? 0.35);

const isFiniteNumber = (value) => Number.isFinite(value);

const normalize = (value) => String(value || '').trim().toLowerCase();

const includesInsensitive = (values = [], target = '') => {
  const needle = normalize(target);
  if (!needle) {
    return false;
  }

  return values.some((value) => normalize(value) === needle);
};

const authorMatches = (bookAuthor = '', preferredAuthors = []) => {
  const normalizedBookAuthor = normalize(bookAuthor);
  if (!normalizedBookAuthor || !preferredAuthors.length) {
    return false;
  }

  return preferredAuthors.some((author) => normalizedBookAuthor.includes(normalize(author)));
};

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

  const rawResults = await getUnifiedVectorSearch(queryEmbedding, vectorFilters, Math.max(limit * 4, 20));

  const filteredByConstraints = rawResults.filter((book) => {
    if (excludeBookIds.has(String(book._id))) {
      return false;
    }

    if (constraints.preferredGenres?.length > 0) {
      if (!includesInsensitive(constraints.preferredGenres, book.genre)) {
        return false;
      }
    }

    if (constraints.dislikedGenres?.length > 0) {
      if (includesInsensitive(constraints.dislikedGenres, book.genre)) {
        return false;
      }
    }

    if (constraints.preferredAuthors?.length > 0) {
      if (!authorMatches(book.author, constraints.preferredAuthors)) {
        return false;
      }
    }

    return true;
  });

  const enriched = filteredByConstraints
    .map((book) => ({
      ...book,
      relevanceScore: Number(book.semanticScore ?? 0),
    }))
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
    retrievedBooks: enriched,
  };
};
