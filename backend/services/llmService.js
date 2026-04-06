import { GROQ_API_KEY } from '../config.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const isGreeting = (text = '') => /^(hi|hello|hey|yo|hola|assalamualaikum|good\s(morning|afternoon|evening))\b/i.test(String(text).trim());

const buildSystemPrompt = () => {
  return [
    'You are a friendly, concise book assistant.',
    'Always recommend matching books immediately from the provided candidates.',
    'Never ask for clarification or more information before recommending.',
    'Explain briefly why each book matches the user request.',
    'Suggest 1-2 refinement options (genre, price, length, pace) they can try.',
    'Only recommend from provided candidates; never invent titles or authors.',
    'Respond in JSON with keys: assistantReply, recommendedTitles (array of book titles).',
  ].join(' ');
};

const buildCandidateLines = (candidates = []) => {
  return candidates.map((book, index) => {
    const synopsis = typeof book.synopsis === 'string' && book.synopsis.trim()
      ? book.synopsis.trim()
      : (typeof book.description === 'string' ? book.description.trim() : 'No synopsis available');

    return `${index + 1}. ${book.title} by ${book.author} | Genre: ${book.genre || 'N/A'} | Price: Tk ${book.price ?? 'N/A'} | Synopsis: ${synopsis}`;
  }).join('\n');
};

const buildUserPrompt = ({ userMessage, memoryProfile = {}, conversationMessages = [], candidates = [] }) => {
  const recentMessages = conversationMessages
    .slice(-6)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');

  return [
    `User message: ${String(userMessage || '').trim()}`,
    `Memory profile: ${JSON.stringify(memoryProfile || {})}`,
    `Recent chat history:\n${recentMessages || 'none'}`,
    `IMPORTANT: You have ${candidates.length} candidate books ranked by relevance. Recommend the top 3-5 immediately.`,
    `Candidate books:\n${buildCandidateLines(candidates) || 'none'}`,
  ].join('\n\n');
};

const parseModelJson = (content, fallbackTitles = []) => {
  try {
    const parsed = JSON.parse(content);
    const assistantReply = typeof parsed.assistantReply === 'string' ? parsed.assistantReply : '';
    const recommendedTitles = Array.isArray(parsed.recommendedTitles)
      ? parsed.recommendedTitles.filter((title) => typeof title === 'string' && title.trim())
      : fallbackTitles;

    return {
      assistantReply,
      recommendedTitles,
    };
  } catch {
    return {
      assistantReply: String(content || ''),
      recommendedTitles: fallbackTitles,
    };
  }
};

const buildFallbackReply = ({ userMessage, candidates = [], usedMemory = false }) => {
  const text = String(userMessage || '').trim();

  if (!text) {
    return {
      assistantReply: 'Tell me your preferred genre, mood, or budget and I will recommend matching books.',
      recommendedTitles: [],
      source: 'fallback-empty',
    };
  }

  if (isGreeting(text)) {
    return {
      assistantReply: 'Hello! What type of books would you like? (e.g., mystery, romance, sci-fi, thriller)',
      recommendedTitles: ['__SHOW_TOP_RANKED__'],  // Signal to show all top-ranked books
      source: 'fallback-greeting',
    };
  }

  const top = candidates.slice(0, 3);
  if (!top.length) {
    return {
      assistantReply: 'I could not find strong matches right now. Share your genre, budget, or reading mood and I will refine it.',
      recommendedTitles: [],
      source: 'fallback-no-candidates',
    };
  }

  const opening = usedMemory
    ? 'Using your saved preferences, here are good options:'
    : 'Here are good options from your catalog:';

  const picks = top
    .map((book) => `- ${book.title} by ${book.author} (Tk ${book.price ?? 'N/A'})`)
    .join('\n');

  return {
    assistantReply: `${opening}\n${picks}\nWant me to narrow by tone, length, or price?`,
    recommendedTitles: top.map((book) => book.title),
    source: 'fallback-local',
  };
};

export const generateAssistantReply = async ({
  userMessage,
  conversationMessages = [],
  memoryProfile = {},
  candidates = [],
}) => {
  const usedMemory = Boolean((conversationMessages || []).length > 0);

  if (!GROQ_API_KEY) {
    return buildFallbackReply({ userMessage, candidates, usedMemory });
  }

  const payload = {
    model: MODEL,
    temperature: 0.4,
    max_tokens: 450,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: buildUserPrompt({ userMessage, memoryProfile, conversationMessages, candidates }),
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
    const parsed = parseModelJson(content, candidates.slice(0, 3).map((book) => book.title));

    if (!parsed.assistantReply) {
      return buildFallbackReply({ userMessage, candidates, usedMemory });
    }

    return {
      assistantReply: parsed.assistantReply,
      recommendedTitles: parsed.recommendedTitles,
      source: 'groq',
    };
  } catch {
    return buildFallbackReply({ userMessage, candidates, usedMemory });
  }
};
