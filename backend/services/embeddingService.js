import { env, pipeline } from '@xenova/transformers';

// Disable downloading local models (use cache only)
env.allowRemoteModels = true;
env.allowLocalModels = true;
env.allowAutoLoadModels = true;

let extractor = null;

// Lazy-load the embedding model (loaded once and reused)
const getExtractor = async () => {
  if (!extractor) {
    console.log('Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
    try {
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true, // Use quantized version for smaller size
      });
      console.log('Embedding model loaded successfully');
    } catch (error) {
      console.error('Failed to load embedding model:', error.message);
      throw new Error('Could not initialize embedding service: ' + error.message);
    }
  }
  return extractor;
};

/**
 * Generate embedding for a single text string
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 384-dimensional embedding vector
 */
export const embedText = async (text) => {
  if (!text || typeof text !== 'string') {
    return new Array(384).fill(0); // Return zero vector for empty input
  }

  try {
    const extractor = await getExtractor();
    const trimmedText = text.substring(0, 512); // Limit to 512 chars due to model limit
    const result = await extractor(trimmedText, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to plain array
    return Array.from(result.data);
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
};

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {number[]} emb1 - First embedding vector
 * @param {number[]} emb2 - Second embedding vector
 * @returns {number} - Cosine similarity score (0-1, already normalized by model)
 */
export const cosineSimilarity = (emb1, emb2) => {
  if (!emb1 || !emb2 || emb1.length !== emb2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < emb1.length; i++) {
    dotProduct += emb1[i] * emb2[i];
    norm1 += emb1[i] * emb1[i];
    norm2 += emb2[i] * emb2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  // Avoid division by zero
  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
};

/**
 * Batch embedding for multiple texts
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export const batchEmbed = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  try {
    const extractor = await getExtractor();
    const embeddings = [];

    // Process in batches to avoid memory issues
    for (let i = 0; i < texts.length; i += 10) {
      const batch = texts.slice(i, i + 10);
      for (const text of batch) {
        const trimmedText = (text || '').substring(0, 512);
        const result = await extractor(trimmedText, {
          pooling: 'mean',
          normalize: true,
        });
        embeddings.push(Array.from(result.data));
      }
    }

    return embeddings;
  } catch (error) {
    console.error('Error batch embedding:', error.message);
    throw error;
  }
};

/**
 * Find most similar embedding from a list
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {number[][]} candidateEmbeddings - List of candidate embeddings
 * @param {number} topK - Number of top results to return
 * @returns {Array<{index: number, similarity: number}>} - Top K matches with indices and similarity
 */
export const findMostSimilar = (queryEmbedding, candidateEmbeddings, topK = 5) => {
  if (!queryEmbedding || !candidateEmbeddings || candidateEmbeddings.length === 0) {
    return [];
  }

  const similarities = candidateEmbeddings
    .map((emb, index) => ({
      index,
      similarity: cosineSimilarity(queryEmbedding, emb),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return similarities;
};

/**
 * Average multiple embeddings (e.g., for user preference profile)
 * @param {number[][]} embeddings - Array of embeddings to average
 * @returns {number[]} - Averaged embedding vector
 */
export const averageEmbeddings = (embeddings) => {
  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    return new Array(384).fill(0);
  }

  const averaged = new Array(384).fill(0);
  const validEmbeddings = embeddings.filter(emb => Array.isArray(emb) && emb.length === 384);

  if (validEmbeddings.length === 0) {
    return averaged;
  }

  for (const embedding of validEmbeddings) {
    for (let i = 0; i < 384; i++) {
      averaged[i] += embedding[i];
    }
  }

  for (let i = 0; i < 384; i++) {
    averaged[i] /= validEmbeddings.length;
  }

  // Normalize the averaged vector
  let norm = 0;
  for (let i = 0; i < 384; i++) {
    norm += averaged[i] * averaged[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < 384; i++) {
      averaged[i] /= norm;
    }
  }

  return averaged;
};

export default {
  embedText,
  cosineSimilarity,
  batchEmbed,
  findMostSimilar,
  averageEmbeddings,
};
