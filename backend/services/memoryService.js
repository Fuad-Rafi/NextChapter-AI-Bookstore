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

  const preferredAuthors = [];
  const authorPatterns = [
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

  return {
    preferredGenres: unique(preferredGenres),
    dislikedGenres: unique(dislikedGenres),
    preferredAuthors: unique(preferredAuthors),
    budgetMin: Number.isFinite(budgetMin) ? budgetMin : null,
    budgetMax: Number.isFinite(budgetMax) ? budgetMax : null,
    pacePreference,
    lengthPreference,
  };
};

export const summarizeConversation = (messages = []) => {
  const recentUserMessages = messages
    .filter((message) => message.role === 'user')
    .slice(-3)
    .map((message) => message.content)
    .join(' / ');

  return `Recent asks: ${recentUserMessages || 'none'}`;
};
