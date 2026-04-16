import { GROQ_API_KEY } from '../config.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const buildSystemPrompt = () => {
  return [
    'You are a grounded book assistant.',
    'Only use the retrieved books that are provided in context.',
    'If the retrieved context is weak or empty, explain that no strong matches were found and suggest refinements.',
    'Do not invent books, authors, or metadata.',
    'Respond in JSON with keys: assistantReply, recommendedTitles (array of titles from context), and refinementHints (array of strings).',
  ].join(' ');
};

const buildRetrievedLines = (retrievedBooks = []) => {
  return retrievedBooks.map((book, index) => {
    const synopsis = typeof book.synopsis === 'string' && book.synopsis.trim()
      ? book.synopsis.trim()
      : (typeof book.description === 'string' ? book.description.trim() : 'No synopsis available');

    return `${index + 1}. ${book.title} by ${book.author} | Genre: ${book.genre || 'N/A'} | Price: Tk ${book.price ?? 'N/A'} | Relevance: ${Number(book.relevanceScore || 0).toFixed(3)} | Synopsis: ${synopsis}`;
  }).join('\n');
};

const buildUserPrompt = ({ userMessage, retrievedBooks = [] }) => {
  return [
    `User message: ${String(userMessage || '').trim()}`,
    `Retrieved books count: ${retrievedBooks.length}`,
    `Retrieved books:\n${buildRetrievedLines(retrievedBooks) || 'none'}`,
    'Task: explain why best matches fit the user request and recommend up to 3 books.',
  ].join('\n\n');
};

const parseModelJson = (content, fallbackTitles = []) => {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { assistantReply: String(content || '') };
  }

  const assistantReply = typeof parsed.assistantReply === 'string' ? parsed.assistantReply : '';
  const recommendedTitles = Array.isArray(parsed.recommendedTitles)
    ? parsed.recommendedTitles.filter((title) => typeof title === 'string' && title.trim())
    : fallbackTitles;
  const refinementHints = Array.isArray(parsed.refinementHints)
    ? parsed.refinementHints.filter((hint) => typeof hint === 'string' && hint.trim())
    : [];

  return {
    assistantReply,
    recommendedTitles,
    refinementHints,
  };
};

const buildFallbackReply = ({ userMessage, retrievedBooks = [] }) => {
  const top = retrievedBooks.slice(0, 3);

  if (!top.length) {
    return {
      assistantReply: 'I could not find strong matches for that request. Try adding a genre, author, or budget range.',
      recommendedTitles: [],
      refinementHints: ['Add a preferred genre', 'Try a wider price range'],
      source: 'fallback-no-context',
    };
  }

  const picks = top
    .map((book, index) => `${index + 1}. ${book.title} by ${book.author} (Tk ${book.price ?? 'N/A'})`)
    .join('\n');

  return {
    assistantReply: `These are the most relevant matches from your catalog:\n${picks}\nShare more detail if you want tighter results.`,
    recommendedTitles: top.map((book) => book.title),
    refinementHints: ['Add genre or mood', 'Set a budget cap'],
    source: 'fallback-grounded',
  };
};

export const generateAssistantReply = async ({
  userMessage,
  retrievedBooks = [],
}) => {
  if (!GROQ_API_KEY) {
    return buildFallbackReply({ userMessage, retrievedBooks });
  }

  const payload = {
    model: MODEL,
    temperature: 0.2,
    max_tokens: 450,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: buildUserPrompt({ userMessage, retrievedBooks }),
      },
    ],
  };

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(`Groq provider error ${response.status}`);
      err.providerStatus = response.status;
      err.providerBody = errorText;
      throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = parseModelJson(content, retrievedBooks.slice(0, 3).map((book) => book.title));

    if (!parsed.assistantReply) {
      return buildFallbackReply({ userMessage, retrievedBooks });
    }

    return {
      assistantReply: parsed.assistantReply,
      recommendedTitles: parsed.recommendedTitles,
      refinementHints: parsed.refinementHints,
      source: 'groq',
    };
  } catch {
    return buildFallbackReply({ userMessage, retrievedBooks });
  }
};
