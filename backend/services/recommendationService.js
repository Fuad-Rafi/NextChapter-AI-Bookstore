import Book from '../models/bookmodels.js';
import Order from '../models/ordermodel.js';
import User from '../models/usermodel.js';
import { buildHistorySignals, rankBooks } from '../utils/recommendationScoring.js';

export const getRankedRecommendations = async ({ userId, query = '', queryEmbedding, limit = 5, mergedMemoryProfile = {} }) => {
  const [user, books, orders] = await Promise.all([
    User.findById(userId).lean(),
    Book.find({}).lean(),
    Order.find({ customerId: userId }).lean(),
  ]);

  const historySignals = buildHistorySignals(orders, books, user?.feedbackProfile || {});

  // Use mergedMemoryProfile (from conversation) if provided, otherwise fall back to database preferences
  const userPreferences = mergedMemoryProfile && Object.keys(mergedMemoryProfile).length > 0
    ? mergedMemoryProfile
    : user?.preferences || {};

  const orderedBookIds = new Set(
    orders
      .map((order) => String(order.bookRef || order.bookId || ''))
      .filter(Boolean)
  );

  const candidates = books.filter((book) => !orderedBookIds.has(String(book._id)));
  const inputBooks = candidates.length > 0 ? candidates : books;

  const ranked = rankBooks({
    books: inputBooks,
    query,
    queryEmbedding,
    userPreferences,
    historySignals,
    limit,
  });

  return {
    user,
    recommendations: ranked.map(({ book, score, breakdown }) => ({
      ...book,
      score,
      scoreBreakdown: breakdown,
    })),
  };
};
