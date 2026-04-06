import mongoose from 'mongoose';

export const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

export const normalizeStringList = (value) => {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const seen = new Set();
  const normalizedValues = [];

  for (const item of values) {
    const normalized = normalizeString(item);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalizedValues.push(normalized);
  }

  return normalizedValues;
};

export const normalizeNumber = (value, fallback = null) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeBoolean = (value, fallback = false) => {
  if (value === true || value === false) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return fallback;
};

export const normalizeBudgetRange = (value = {}) => {
  if (!value || typeof value !== 'object') {
    return { min: null, max: null };
  }

  return {
    min: normalizeNumber(value.min, null),
    max: normalizeNumber(value.max, null),
  };
};

export const buildBookSearchText = (book = {}) => {
  const parts = [
    book.title,
    book.author,
    book.description,
    book.genre,
    ...(Array.isArray(book.tags) ? book.tags : []),
    ...(Array.isArray(book.themes) ? book.themes : []),
    ...(Array.isArray(book.subjects) ? book.subjects : []),
    book.language,
    book.audience,
  ];

  return parts
    .map((part) => normalizeString(part))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

export const normalizeBookPayload = (body = {}) => {
  const publishedDate = body.publishedDate ?? body.publishYear;
  const rating = normalizeNumber(body.rating, null);

  const payload = {
    title: normalizeString(body.title),
    author: normalizeString(body.author),
    description: normalizeString(body.description),
    synopsis: normalizeString(body.synopsis || body.description),
    genre: normalizeString(body.genre),
    tags: normalizeStringList(body.tags),
    themes: normalizeStringList(body.themes),
    subjects: normalizeStringList(body.subjects),
    language: normalizeString(body.language),
    audience: normalizeString(body.audience),
    publishedDate,
    coverImage: typeof body.coverImage === 'string' ? body.coverImage : '',
    price: normalizeNumber(body.price, null),
    rating,
    isPublished: normalizeBoolean(body.isPublished, true),
  };

  return {
    ...payload,
    searchText: buildBookSearchText(payload),
  };
};

export const normalizeUserPreferences = (input = {}) => {
  const source = input.preferences && typeof input.preferences === 'object'
    ? input.preferences
    : input;

  return {
    preferredGenres: normalizeStringList(source.preferredGenres ?? source.genres),
    dislikedGenres: normalizeStringList(source.dislikedGenres),
    favoriteAuthors: normalizeStringList(source.favoriteAuthors),
    favoriteThemes: normalizeStringList(source.favoriteThemes),
    tonePreferences: normalizeStringList(source.tonePreferences),
    readingGoals: normalizeStringList(source.readingGoals),
    preferredLanguage: normalizeString(source.preferredLanguage),
    budgetRange: normalizeBudgetRange(source.budgetRange),
    notes: normalizeString(source.notes),
  };
};

export const normalizeAssistantMemory = (input = {}) => ({
  chatSummary: normalizeString(input.chatSummary),
  lastConversationAt: input.lastConversationAt ?? null,
  lastUpdatedAt: input.lastUpdatedAt ?? null,
});

export const normalizeOrderPayload = (body = {}, userId = null) => {
  const normalizedBookId = normalizeString(body.bookId);
  const bookRef = mongoose.Types.ObjectId.isValid(normalizedBookId)
    ? new mongoose.Types.ObjectId(normalizedBookId)
    : null;

  return {
    bookId: normalizedBookId,
    bookRef,
    customerId: mongoose.Types.ObjectId.isValid(String(userId)) ? new mongoose.Types.ObjectId(String(userId)) : null,
    bookTitle: normalizeString(body.bookTitle),
    bookAuthor: normalizeString(body.bookAuthor),
    customerName: normalizeString(body.customerName),
    customerAddress: normalizeString(body.customerAddress),
    customerPhone: normalizeString(body.customerPhone),
  };
};
