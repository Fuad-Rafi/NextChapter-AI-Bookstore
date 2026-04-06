import express from 'express';
import mongoose from 'mongoose';
import ChatMemory from '../models/chatmemorymodel.js';
import User from '../models/usermodel.js';
import Book from '../models/bookmodels.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { getRankedRecommendations } from '../services/recommendationService.js';
import { generateAssistantReply } from '../services/llmService.js';
import {
  RATE_LIMIT_ASSISTANT_CHAT_PER_MINUTE,
  RATE_LIMIT_ASSISTANT_FEEDBACK_PER_MINUTE,
} from '../config.js';
import { safeLogError } from '../utils/securityLogger.js';
import {
  buildAssistantReply,
  buildRecommendationQuery,
  extractPreferenceSignals,
  mergeMemoryProfile,
  summarizeConversation,
} from '../services/memoryService.js';
import * as embeddingService from '../services/embeddingService.js';

const router = express.Router();

const MAX_MESSAGE_LENGTH = 1000;
const FEEDBACK_EVENTS = ['like', 'dislike', 'click', 'view'];

const FEEDBACK_FIELD_BY_EVENT = {
  like: 'likedBookIds',
  dislike: 'dislikedBookIds',
  click: 'clickedBookIds',
  view: 'viewedBookIds',
};

const assistantChatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: RATE_LIMIT_ASSISTANT_CHAT_PER_MINUTE,
  message: 'Too many chat requests. Please retry shortly.',
});

const assistantFeedbackRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: RATE_LIMIT_ASSISTANT_FEEDBACK_PER_MINUTE,
  message: 'Too many feedback requests. Please retry shortly.',
});

const mergeStringArrays = (existing = [], incoming = []) => {
  return [...new Set([...(existing || []), ...(incoming || [])].filter(Boolean))];
};

const pushUniqueObjectId = (values = [], id) => {
  const asStrings = new Set((values || []).map((item) => String(item)));
  if (!asStrings.has(String(id))) {
    values.push(id);
  }
};

const removeObjectId = (values = [], id) => {
  return (values || []).filter((item) => String(item) !== String(id));
};

const updateUserFromMemory = async ({ userId, memoryProfile, conversationSummary }) => {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  const preferences = user.preferences || {};
  preferences.preferredGenres = mergeStringArrays(preferences.preferredGenres, memoryProfile.preferredGenres);
  preferences.dislikedGenres = mergeStringArrays(preferences.dislikedGenres, memoryProfile.dislikedGenres);
  preferences.favoriteAuthors = mergeStringArrays(
    preferences.favoriteAuthors,
    memoryProfile.preferredAuthors
  );

  preferences.budgetRange = preferences.budgetRange || { min: null, max: null };
  if (typeof memoryProfile.budgetMin === 'number') {
    preferences.budgetRange.min = memoryProfile.budgetMin;
  }
  if (typeof memoryProfile.budgetMax === 'number') {
    preferences.budgetRange.max = memoryProfile.budgetMax;
  }

  user.preferences = preferences;
  user.assistantMemory = {
    ...(user.assistantMemory || {}),
    chatSummary: conversationSummary,
    lastConversationAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  await user.save();
};

router.post('/chat', authenticateToken, requireRole('customer'), assistantChatRateLimiter, async (req, res) => {
  try {
    const rawMessage = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!rawMessage) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (rawMessage.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message must be <= ${MAX_MESSAGE_LENGTH} characters` });
    }

    const requestedLimit = Number(req.body.limit ?? 5);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 8)
      : 5;

    // Load user first (needed for preference loading) - renamed to avoid conflict with destructured user
    const currentUserDb = await User.findById(req.user.id).lean();

    let conversation;
    if (req.body.conversationId && mongoose.Types.ObjectId.isValid(String(req.body.conversationId))) {
      conversation = await ChatMemory.findOne({
        _id: req.body.conversationId,
        userId: req.user.id,
      });
    }

    if (!conversation) {
      conversation = await ChatMemory.create({
        userId: req.user.id,
        messages: [],
      });
    }

    const extractedSignals = extractPreferenceSignals(rawMessage);

    // Load user's saved preferences from database and merge with conversation history
    let userSavedPreferences = {};
    if (currentUserDb?.preferences) {
      userSavedPreferences = {
        preferredGenres: currentUserDb.preferences.preferredGenres || [],
        dislikedGenres: currentUserDb.preferences.dislikedGenres || [],
        preferredAuthors:
          currentUserDb.preferences.preferredAuthors
          || currentUserDb.preferences.favoriteAuthors
          || [],
        budgetMin: currentUserDb.preferences.budgetRange?.min,
        budgetMax: currentUserDb.preferences.budgetRange?.max,
        pacePreference: currentUserDb.preferences.pacePreference,
        lengthPreference: currentUserDb.preferences.lengthPreference,
      };
    }

    // Merge: saved preferences → conversation history → incoming signals (priority order)
    // Mark extractedSignals as current message so genres/authors REPLACE old ones (not accumulate)
    const mergedMemoryProfile = mergeMemoryProfile(
      mergeMemoryProfile(userSavedPreferences, conversation.memoryProfile || {}, false),
      extractedSignals,
      true // isCurrentMessage - genres/authors replace old ones, not accumulate
    );
    const lastAssistantMessage = [...conversation.messages].reverse().find((entry) => entry.role === 'assistant');
    const recommendationQuery = buildRecommendationQuery({
      userMessage: rawMessage,
      memoryProfile: mergedMemoryProfile,
      lastAssistantMessage,
    });

    // Generate embedding for semantic similarity
    let queryEmbedding;
    try {
      queryEmbedding = await embeddingService.embedText(recommendationQuery);
    } catch (embedError) {
      safeLogError('Failed to generate query embedding', embedError);
      queryEmbedding = undefined; // Fall back to token-based matching
    }

    const { user, recommendations } = await getRankedRecommendations({
      userId: req.user.id,
      query: recommendationQuery,
      queryEmbedding,
      limit,
      mergedMemoryProfile,
    });

    // Hard filter: Remove books above budget constraint
    const filteredRecommendations = recommendations.filter((book) => {
      if (typeof mergedMemoryProfile.budgetMax === 'number') {
        return book.price <= mergedMemoryProfile.budgetMax;
      }
      return true;
    });

    const userMessageEntry = {
      role: 'user',
      content: rawMessage,
      retrievedBookIds: [],
      extractedPreferences: {
        preferredGenres: extractedSignals.preferredGenres,
        dislikedGenres: extractedSignals.dislikedGenres,
        preferredAuthors: extractedSignals.preferredAuthors,
        budgetMin: extractedSignals.budgetMin,
        budgetMax: extractedSignals.budgetMax,
        pacePreference: extractedSignals.pacePreference,
        lengthPreference: extractedSignals.lengthPreference,
      },
      createdAt: new Date(),
    };

    let llmResult;
    try {
      llmResult = await generateAssistantReply({
        userMessage: rawMessage,
        conversationMessages: conversation.messages,
        memoryProfile: mergedMemoryProfile,
        candidates: filteredRecommendations,
      });
    } catch {
      llmResult = null;
    }

    const assistantReply = llmResult?.assistantReply || buildAssistantReply({
      userMessage: rawMessage,
      recommendations: filteredRecommendations,
      memoryProfile: mergedMemoryProfile,
      usedMemory: Boolean(lastAssistantMessage || (conversation.messages || []).length > 0),
    });

    // FIXED: Use top-ranked books directly instead of filtering by title match
    // This avoids the fragile exact-match problem that causes empty recommendations
    const recommendedBookIds = filteredRecommendations
      .slice(0, limit)
      .map((book) => book._id);

    const assistantMessageEntry = {
      role: 'assistant',
      content: assistantReply,
      retrievedBookIds: recommendedBookIds,
      createdAt: new Date(),
    };

    conversation.messages.push(userMessageEntry);
    conversation.messages.push(assistantMessageEntry);
    conversation.memoryProfile = {
      ...mergedMemoryProfile,
      lastReferencedTitle: filteredRecommendations[0]?.title || mergedMemoryProfile.lastReferencedTitle || '',
    };
    conversation.summary = summarizeConversation(conversation.messages, conversation.memoryProfile);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await updateUserFromMemory({
      userId: req.user.id,
      memoryProfile: conversation.memoryProfile,
      conversationSummary: conversation.summary,
    });

    // Return top-ranked books directly (already perfectly scored by ranking system)
    const responseRecommendations = filteredRecommendations
      .slice(0, limit)
      .map((book) => ({
        _id: book._id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        synopsis: book.synopsis || book.description,
        price: book.price,
        rating: book.rating,
        score: book.score,
      }));

    return res.status(200).json({
      conversationId: conversation._id,
      assistantMessage: assistantMessageEntry.content,
      recommendations: responseRecommendations,
      memorySummary: conversation.summary,
      profileSnapshot: {
        preferredGenres: mergedMemoryProfile.preferredGenres || [],
        dislikedGenres: mergedMemoryProfile.dislikedGenres || [],
        preferredAuthors: mergedMemoryProfile.preferredAuthors || [],
        budgetRange: {
          min: mergedMemoryProfile.budgetMin,
          max: mergedMemoryProfile.budgetMax,
        },
        pacePreference: mergedMemoryProfile.pacePreference,
        lengthPreference: mergedMemoryProfile.lengthPreference,
      },
    });
  } catch (error) {
    safeLogError('Chat error', error, { conversationId: req.body?.conversationId, userId: req.user?.id });
    return res.status(500).json({ message: 'Failed to process chat request' });
  }
});

router.post('/feedback', authenticateToken, requireRole('customer'), assistantFeedbackRateLimiter, async (req, res) => {
  try {
    const eventType = typeof req.body.eventType === 'string' ? req.body.eventType.trim().toLowerCase() : '';
    const bookId = typeof req.body.bookId === 'string' ? req.body.bookId.trim() : '';
    const conversationId = typeof req.body.conversationId === 'string' ? req.body.conversationId.trim() : '';

    if (!FEEDBACK_EVENTS.includes(eventType)) {
      return res.status(400).json({ message: 'eventType must be one of: like, dislike, click, view' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: 'A valid bookId is required' });
    }

    const [user, book] = await Promise.all([
      User.findById(req.user.id),
      Book.findById(bookId).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    user.feedbackProfile = user.feedbackProfile || {};
    user.feedbackProfile.likedBookIds = user.feedbackProfile.likedBookIds || [];
    user.feedbackProfile.dislikedBookIds = user.feedbackProfile.dislikedBookIds || [];
    user.feedbackProfile.clickedBookIds = user.feedbackProfile.clickedBookIds || [];
    user.feedbackProfile.viewedBookIds = user.feedbackProfile.viewedBookIds || [];

    const targetField = FEEDBACK_FIELD_BY_EVENT[eventType];
    pushUniqueObjectId(user.feedbackProfile[targetField], new mongoose.Types.ObjectId(bookId));

    if (eventType === 'like') {
      user.feedbackProfile.dislikedBookIds = removeObjectId(user.feedbackProfile.dislikedBookIds, bookId);
    }

    if (eventType === 'dislike') {
      user.feedbackProfile.likedBookIds = removeObjectId(user.feedbackProfile.likedBookIds, bookId);
    }

    const genre = typeof book.genre === 'string' ? book.genre.trim().toLowerCase() : '';
    user.preferences = user.preferences || {};
    user.preferences.preferredGenres = user.preferences.preferredGenres || [];
    user.preferences.dislikedGenres = user.preferences.dislikedGenres || [];

    if (eventType === 'like' && genre) {
      user.preferences.preferredGenres = mergeStringArrays(user.preferences.preferredGenres, [genre]);
      user.preferences.dislikedGenres = user.preferences.dislikedGenres.filter((item) => String(item).toLowerCase() !== genre);
    }

    if (eventType === 'dislike' && genre) {
      user.preferences.dislikedGenres = mergeStringArrays(user.preferences.dislikedGenres, [genre]);
      user.preferences.preferredGenres = user.preferences.preferredGenres.filter((item) => String(item).toLowerCase() !== genre);
    }

    user.feedbackProfile.updatedAt = new Date();
    await user.save();

    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      const conversation = await ChatMemory.findOne({ _id: conversationId, userId: req.user.id });
      if (conversation) {
        const targetMessage = [...conversation.messages]
          .reverse()
          .find(
            (message) => message.role === 'assistant'
              && (message.retrievedBookIds || []).some((id) => String(id) === String(bookId))
          );

        if (targetMessage) {
          targetMessage.feedback = targetMessage.feedback || {};
          targetMessage.feedback.likedBookIds = targetMessage.feedback.likedBookIds || [];
          targetMessage.feedback.dislikedBookIds = targetMessage.feedback.dislikedBookIds || [];
          targetMessage.feedback.clickedBookIds = targetMessage.feedback.clickedBookIds || [];
          targetMessage.feedback.viewedBookIds = targetMessage.feedback.viewedBookIds || [];
          pushUniqueObjectId(targetMessage.feedback[targetField], new mongoose.Types.ObjectId(bookId));
          conversation.markModified('messages');
          await conversation.save();
        }
      }
    }

    return res.status(200).json({
      message: 'Feedback recorded',
      eventType,
      bookId,
      profileSnapshot: {
        preferredGenres: user.preferences.preferredGenres || [],
        dislikedGenres: user.preferences.dislikedGenres || [],
        likedBookIds: (user.feedbackProfile.likedBookIds || []).map((id) => String(id)),
        dislikedBookIds: (user.feedbackProfile.dislikedBookIds || []).map((id) => String(id)),
        clickedBookIds: (user.feedbackProfile.clickedBookIds || []).map((id) => String(id)),
        viewedBookIds: (user.feedbackProfile.viewedBookIds || []).map((id) => String(id)),
      },
    });
  } catch (error) {
    safeLogError('Feedback error', error, {
      eventType: req.body?.eventType,
      conversationId: req.body?.conversationId,
      userId: req.user?.id,
    });
    return res.status(500).json({ message: 'Failed to record feedback' });
  }
});

export default router;
