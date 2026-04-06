const KNOWN_GENRES = [
  'mystery',
  'thriller',
  'romance',
  'fantasy',
  'science fiction',
  'sci-fi',
  'historical',
  'horror',
  'non-fiction',
  'biography',
  'self-help',
  'young adult',
  'adventure',
  'drama',
  'poetry',
  'classic',
];

const unique = (values = []) => [...new Set(values.filter(Boolean))];

const normalizeAuthorName = (name = '') => {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
};

const normalizeGenre = (genre) => {
  const value = String(genre || '').toLowerCase().trim();
  if (value === 'sci-fi') {
    return 'science fiction';
  }
  return value;
};

export const extractPreferenceSignals = (text = '') => {
  const rawContent = String(text || '').trim();
  const content = rawContent.toLowerCase();

  const preferredGenres = KNOWN_GENRES
    .filter((genre) => content.includes(genre))
    .map(normalizeGenre);

  const dislikedGenres = [];
  const dislikePatterns = [
    /do not like\s+([a-z\-\s]+)/i,
    /don't like\s+([a-z\-\s]+)/i,
    /avoid\s+([a-z\-\s]+)/i,
    /no\s+([a-z\-\s]+)\s+please/i,
  ];

  for (const pattern of dislikePatterns) {
    const match = content.match(pattern);
    if (!match || !match[1]) {
      continue;
    }

    const snippet = match[1];
    for (const genre of KNOWN_GENRES) {
      if (snippet.includes(genre)) {
        dislikedGenres.push(normalizeGenre(genre));
      }
    }
  }

  let budgetMin = null;
  let budgetMax = null;

  const rangeMatch = content.match(/(?:between|from)\s*(?:tk|taka|৳)?\s*(\d{2,4})\s*(?:and|to|-)+\s*(?:tk|taka|৳)?\s*(\d{2,4})/i);
  if (rangeMatch) {
    budgetMin = Number(rangeMatch[1]);
    budgetMax = Number(rangeMatch[2]);
  }

  const underMatch = content.match(/(?:under|below|less than|max(?:imum)?)\s*(?:tk|taka|৳)?\s*(\d{2,4})/i);
  if (underMatch) {
    budgetMax = Number(underMatch[1]);
  }

  const overMatch = content.match(/(?:over|above|more than|min(?:imum)?)\s*(?:tk|taka|৳)?\s*(\d{2,4})/i);
  if (overMatch) {
    budgetMin = Number(overMatch[1]);
  }

  let pacePreference = '';
  if (/(fast-paced|fast paced|page-turner|intense)/i.test(content)) {
    pacePreference = 'fast-paced';
  } else if (/(slow-burn|slow burn|reflective|character-driven)/i.test(content)) {
    pacePreference = 'slow-burn';
  }

  let lengthPreference = '';
  if (/(short|quick read|not too long|light read)/i.test(content)) {
    lengthPreference = 'short';
  } else if (/(long|epic|detailed|series)/i.test(content)) {
    lengthPreference = 'long';
  }

  // Extract author preferences (e.g., "i love Stephen King books", "books by James Patterson", "I like Stephen King")
  const preferredAuthors = [];
  const authorPatterns = [
    // Matches: "I like Stephen King", "books by Stephen King", "Stephen King's books"
    /(?:love|like|adore|prefer)(?:\s+(?:reading\s+)?(?:books?\s+by\s+)?|\s+)([a-z][a-z.'-]*(?:\s+[a-z][a-z.'-]*){0,3})(?:\s+(?:books?|novels?|works?))?/gi,
    /(?:books?\s+by|from|written by)\s+([a-z][a-z.'-]*(?:\s+[a-z][a-z.'-]*){0,3})/gi,
    /([a-z][a-z.'-]*(?:\s+[a-z][a-z.'-]*){0,3})'s\s+(?:books?|works?|novels?)/gi,
  ];

  for (const pattern of authorPatterns) {
    let match;
    while ((match = pattern.exec(rawContent)) !== null) {
      const author = normalizeAuthorName(match[1]);
      if (author.length > 2 && !preferredAuthors.includes(author)) {
        preferredAuthors.push(author);
      }
    }
  }

  const followUpLikePrevious = /(more like|similar to|like the second|like the first|same vibe)/i.test(content);

  return {
    preferredGenres: unique(preferredGenres),
    dislikedGenres: unique(dislikedGenres),
    preferredAuthors: unique(preferredAuthors),
    budgetMin: Number.isFinite(budgetMin) ? budgetMin : null,
    budgetMax: Number.isFinite(budgetMax) ? budgetMax : null,
    pacePreference,
    lengthPreference,
    followUpLikePrevious,
  };
};

export const mergeMemoryProfile = (currentProfile = {}, incomingSignals = {}, isCurrentMessage = false) => {
  // When current message specifies preferences, they take priority:
  // - New genres → replace old genres (user changed their mind)
  // - New authors → clear genres AND use only new authors (author search is specific intent)
  const hasNewGenres = isCurrentMessage && incomingSignals.preferredGenres?.length > 0;
  const hasNewAuthors = isCurrentMessage && incomingSignals.preferredAuthors?.length > 0;

  const merged = {
    // If new genres specified in current message, use ONLY those (replaced old genres)
    preferredGenres: hasNewGenres
      ? unique(incomingSignals.preferredGenres.map(normalizeGenre))
      // If new authors specified, clear old genres (author search is primary intent)
      : hasNewAuthors
        ? []
        // Otherwise accumulate genres from history
        : unique([
            ...(currentProfile.preferredGenres || []),
            ...(incomingSignals.preferredGenres || []),
          ].map(normalizeGenre)),

    // Always accumulate disliked genres
    dislikedGenres: unique([
      ...(currentProfile.dislikedGenres || []),
      ...(incomingSignals.dislikedGenres || []),
    ].map(normalizeGenre)),

    // If new authors specified in current message, use ONLY those (replace old authors)
    preferredAuthors: hasNewAuthors
      ? unique(incomingSignals.preferredAuthors.map(a => String(a).trim()))
      // Otherwise accumulate from history
      : unique([
          ...(currentProfile.preferredAuthors || []),
          ...(incomingSignals.preferredAuthors || []),
        ].map(a => String(a).trim())),

    budgetMin: currentProfile.budgetMin ?? null,
    budgetMax: currentProfile.budgetMax ?? null,
    pacePreference: incomingSignals.pacePreference || currentProfile.pacePreference || '',
    lengthPreference: incomingSignals.lengthPreference || currentProfile.lengthPreference || '',
    lastReferencedTitle: currentProfile.lastReferencedTitle || '',
  };

  // Budget can be replaced if new constraints specified
  if (typeof incomingSignals.budgetMin === 'number') {
    merged.budgetMin = incomingSignals.budgetMin;
  }

  if (typeof incomingSignals.budgetMax === 'number') {
    merged.budgetMax = incomingSignals.budgetMax;
  }

  return merged;
};

export const buildRecommendationQuery = ({ userMessage, memoryProfile, lastAssistantMessage }) => {
  const pieces = [String(userMessage || '').trim()];

  if (Array.isArray(memoryProfile?.preferredAuthors) && memoryProfile.preferredAuthors.length > 0) {
    pieces.push(`Preferred authors: ${memoryProfile.preferredAuthors.join(', ')}`);
  }

  if (Array.isArray(memoryProfile?.preferredGenres) && memoryProfile.preferredGenres.length > 0) {
    pieces.push(`Preferred genres: ${memoryProfile.preferredGenres.join(', ')}`);
  }

  if (Array.isArray(memoryProfile?.dislikedGenres) && memoryProfile.dislikedGenres.length > 0) {
    pieces.push(`Avoid genres: ${memoryProfile.dislikedGenres.join(', ')}`);
  }

  if (typeof memoryProfile?.budgetMax === 'number') {
    pieces.push(`Budget max Tk ${memoryProfile.budgetMax}`);
  }

  if (typeof memoryProfile?.budgetMin === 'number') {
    pieces.push(`Budget min Tk ${memoryProfile.budgetMin}`);
  }

  if (memoryProfile?.pacePreference) {
    pieces.push(`Pace: ${memoryProfile.pacePreference}`);
  }

  if (memoryProfile?.lengthPreference) {
    pieces.push(`Length: ${memoryProfile.lengthPreference}`);
  }

  if (lastAssistantMessage?.content) {
    pieces.push(`Previous recommendations context: ${lastAssistantMessage.content}`);
  }

  return pieces.filter(Boolean).join(' | ');
};

export const summarizeConversation = (messages = [], memoryProfile = {}) => {
  const recentUserMessages = messages
    .filter((message) => message.role === 'user')
    .slice(-3)
    .map((message) => message.content)
    .join(' / ');

  const parts = [];
  if (memoryProfile.preferredGenres?.length) {
    parts.push(`likes ${memoryProfile.preferredGenres.join(', ')}`);
  }
  if (memoryProfile.dislikedGenres?.length) {
    parts.push(`avoids ${memoryProfile.dislikedGenres.join(', ')}`);
  }
  if (memoryProfile.preferredAuthors?.length) {
    parts.push(`likes authors ${memoryProfile.preferredAuthors.join(', ')}`);
  }
  if (typeof memoryProfile.budgetMax === 'number') {
    parts.push(`budget <= Tk ${memoryProfile.budgetMax}`);
  }
  if (memoryProfile.pacePreference) {
    parts.push(`pace ${memoryProfile.pacePreference}`);
  }
  if (memoryProfile.lengthPreference) {
    parts.push(`length ${memoryProfile.lengthPreference}`);
  }

  const preferenceSummary = parts.length > 0
    ? `User ${parts.join('; ')}`
    : 'No stable preference extracted yet';

  return `${preferenceSummary}. Recent asks: ${recentUserMessages || 'none'}`;
};

export const buildAssistantReply = ({ userMessage, recommendations = [], memoryProfile = {}, usedMemory = false }) => {
  if (!recommendations.length) {
    return 'I could not find strong matches in the catalog right now. Share your preferred genre, mood, or budget and I will refine the results.';
  }

  const opening = usedMemory
    ? 'Using your saved preferences from earlier messages, here are strong matches:'
    : 'Here are recommendations based on your request:';

  const lines = recommendations.slice(0, 3).map((book, index) => {
    const reasons = [];

    if (memoryProfile.preferredGenres?.length && memoryProfile.preferredGenres.includes(String(book.genre || '').toLowerCase())) {
      reasons.push('matches your preferred genre');
    }

    if (typeof memoryProfile.budgetMax === 'number' && typeof book.price === 'number' && book.price <= memoryProfile.budgetMax) {
      reasons.push('fits your budget');
    }

    if (!reasons.length) {
      reasons.push('relevant to your recent query');
    }

    return `${index + 1}. ${book.title} by ${book.author} (Tk ${book.price ?? 'N/A'}) - ${reasons.join(' and ')}`;
  });

  const followUp = /more|another|similar|like/.test(String(userMessage || '').toLowerCase())
    ? 'If you want, I can now narrow this list by tone, reading length, or language.'
    : 'Tell me if you want faster-paced, shorter, or cheaper options next.';

  return `${opening}\n${lines.join('\n')}\n${followUp}`;
};

/**
 * Generate embedding from memory profile for semantic user similarity
 * @param {Object} memoryProfile - User's memory profile with preferences
 * @returns {Promise<number[]>} - Embedding vector representing user preferences
 */
export const getMemoryEmbedding = async (memoryProfile = {}) => {
  // Build text representation of user preferences
  const parts = [];

  if (memoryProfile.preferredGenres?.length) {
    parts.push(`likes ${memoryProfile.preferredGenres.join(', ')}`);
  }

  if (memoryProfile.dislikedGenres?.length) {
    parts.push(`avoids ${memoryProfile.dislikedGenres.join(', ')}`);
  }

  if (memoryProfile.preferredAuthors?.length) {
    parts.push(`likes authors ${memoryProfile.preferredAuthors.join(', ')}`);
  }

  if (typeof memoryProfile.budgetMin === 'number' || typeof memoryProfile.budgetMax === 'number') {
    const min = memoryProfile.budgetMin ?? 'any';
    const max = memoryProfile.budgetMax ?? 'any';
    parts.push(`budget Tk ${min} to ${max}`);
  }

  if (memoryProfile.pacePreference) {
    parts.push(`prefers ${memoryProfile.pacePreference} paced books`);
  }

  if (memoryProfile.lengthPreference) {
    parts.push(`prefers ${memoryProfile.lengthPreference} books`);
  }

  const profileText = parts.length > 0
    ? parts.join('. ')
    : 'no specific preferences set';

  // Import here to avoid circular dependency
  const { embedText } = await import('./embeddingService.js');
  return embedText(profileText);
};
