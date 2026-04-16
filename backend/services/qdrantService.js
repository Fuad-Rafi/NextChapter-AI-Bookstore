import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';
import {
  EMBEDDING_MODEL,
  QDRANT_API_KEY,
  QDRANT_CHECK_COMPATIBILITY,
  QDRANT_COLLECTION,
  QDRANT_ENABLED,
  QDRANT_URL,
} from '../config.js';

let client;
let collectionReady = false;

const isEnabled = () => Boolean(QDRANT_ENABLED && QDRANT_URL);

const getClient = () => {
  if (!isEnabled()) {
    return null;
  }

  if (!client) {
    client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY || undefined,
      checkCompatibility: QDRANT_CHECK_COMPATIBILITY,
    });
  }

  return client;
};

const toQdrantPointId = (mongoId) => {
  const raw = String(mongoId || '').trim().toLowerCase();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/[^a-f0-9]/g, '').padEnd(24, '0').slice(0, 24);
  const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
  const hex32 = `${normalized}${hash}`;

  return `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-4${hex32.slice(13, 16)}-a${hex32.slice(17, 20)}-${hex32.slice(20, 32)}`;
};

export const ensureQdrantCollection = async () => {
  const qdrant = getClient();
  if (!qdrant) {
    return false;
  }

  if (collectionReady) {
    return true;
  }

  try {
    await qdrant.getCollection(QDRANT_COLLECTION);
    collectionReady = true;
    return true;
  } catch {
    await qdrant.createCollection(QDRANT_COLLECTION, {
      vectors: {
        size: 384,
        distance: 'Cosine',
      },
    });
    collectionReady = true;
    return true;
  }
};

const toBookPayload = (book = {}) => ({
  mongoId: String(book._id || ''),
  title: String(book.title || ''),
  author: String(book.author || ''),
  genre: String(book.genre || ''),
  language: String(book.language || ''),
  audience: String(book.audience || ''),
  tags: Array.isArray(book.tags) ? book.tags : [],
  themes: Array.isArray(book.themes) ? book.themes : [],
  subjects: Array.isArray(book.subjects) ? book.subjects : [],
  price: typeof book.price === 'number' ? book.price : null,
  rating: typeof book.rating === 'number' ? book.rating : null,
  isPublished: Boolean(book.isPublished),
  modelVersion: EMBEDDING_MODEL,
  updatedAt: new Date().toISOString(),
});

export const upsertBookPoint = async (book = {}) => {
  const qdrant = getClient();
  const pointId = toQdrantPointId(book._id);
  if (!qdrant || !Array.isArray(book.embedding) || book.embedding.length === 0 || !pointId) {
    return false;
  }

  await ensureQdrantCollection();

  await qdrant.upsert(QDRANT_COLLECTION, {
    wait: false,
    points: [
      {
        id: pointId,
        vector: book.embedding,
        payload: toBookPayload(book),
      },
    ],
  });

  return true;
};

export const deleteBookPoint = async (bookId) => {
  const qdrant = getClient();
  const pointId = toQdrantPointId(bookId);
  if (!qdrant || !pointId) {
    return false;
  }

  await ensureQdrantCollection();
  await qdrant.delete(QDRANT_COLLECTION, {
    wait: false,
    points: [pointId],
  });

  return true;
};

export const resetQdrantCollection = async () => {
  const qdrant = getClient();
  if (!qdrant) {
    return false;
  }

  try {
    await qdrant.deleteCollection(QDRANT_COLLECTION);
  } catch {
    // Ignore if the collection does not exist yet.
  }

  collectionReady = false;
  await ensureQdrantCollection();
  return true;
};

const buildQdrantFilter = (filters = {}) => {
  const must = [];

  if (Array.isArray(filters.genres) && filters.genres.length > 0) {
    must.push({
      key: 'genre',
      match: {
        any: filters.genres,
      },
    });
  }

  if (typeof filters.minPrice === 'number' || typeof filters.maxPrice === 'number') {
    const range = {};
    if (typeof filters.minPrice === 'number') {
      range.gte = filters.minPrice;
    }
    if (typeof filters.maxPrice === 'number') {
      range.lte = filters.maxPrice;
    }

    must.push({
      key: 'price',
      range,
    });
  }

  if (!must.length) {
    return undefined;
  }

  return { must };
};

export const searchBookPoints = async (queryEmbedding = [], { limit = 20, filters = {} } = {}) => {
  const qdrant = getClient();
  if (!qdrant || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    return [];
  }

  await ensureQdrantCollection();

  const results = await qdrant.search(QDRANT_COLLECTION, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
    filter: buildQdrantFilter(filters),
  });

  return (results || []).map((item) => ({
    id: String(item.payload?.mongoId || item.id),
    score: Number(item.score || 0),
    payload: item.payload || {},
  }));
};

export const isQdrantEnabled = () => isEnabled();
