import { GROQ_API_KEY } from '../config.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const buildSystemPrompt = () => {
  return [
    'You are a friendly, conversational book assistant.',
    'Always base your recommendations exclusively on the provided retrieved context.',
    'If the retrieved context is weak or empty, explain that no strong matches were found and suggest refinements.',
    'Do not invent books, authors, or metadata.',
    'Crucially, in your `assistantReply`, you MUST provide a brief (1-2 line) explanation for EACH of the top 1 or 2 best matches.',
    'Explain exactly why those specific books are the best fit for their request based on their synopsis and metadata.',
    'Speak like an expert bookseller talking to a friend in a natural, conversational tone.',
    'Respond in JSON with keys: assistantReply (your conversational explanation including the book justifications), recommendedTitles (array of 2 to 4 titles you are recommending from the context), and refinementHints (array of 2 strings to help them narrow down further).',
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

const buildUserPrompt = ({ userMessage, retrievedBooks = [], chatHistory = [] }) => {
  const historyText = chatHistory.length > 0 
    ? `Recent history:\n` + chatHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')
    : '';

  return [
    `User message: ${String(userMessage || '').trim()}`,
    historyText,
    `Retrieved books count: ${retrievedBooks.length}`,
    `Retrieved books:\n${buildRetrievedLines(retrievedBooks) || 'none'}`,
    'Task: Give a friendly, conversational reply. Include a 1-2 line explanation for why the top 1 or 2 matches are perfect for them. Use the synopsis and metadata provided. Do not sound robotic.',
  ].filter(Boolean).join('\n\n');
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
  const top = retrievedBooks.slice(0, 5);

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
  chatHistory = [],
}) => {
  if (!GROQ_API_KEY) {
    return buildFallbackReply({ userMessage, retrievedBooks });
  }

  const payload = {
    model: MODEL,
    temperature: 0.2,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: buildUserPrompt({ userMessage, retrievedBooks, chatHistory }),
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
    const parsed = parseModelJson(content, retrievedBooks.map((book) => book.title));

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

export const reformulateQuery = async (chatHistory = [], currentMessage = '') => {
  if (!GROQ_API_KEY || chatHistory.length === 0) return currentMessage;

  const historyText = chatHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n');
  const payload = {
    model: MODEL,
    temperature: 0.1,
    max_tokens: 100,
    messages: [
      { role: 'system', content: 'You are a query reformulator for a book recommendation system. Given the chat history and the latest user message, rewrite the user message into a standalone search query that captures all implied context (e.g. genre, theme). If the user message is standalone, just return it. Do not include chatty text, respond ONLY with the query.' },
      { role: 'user', content: `Chat History:\n${historyText}\n\nLatest User Message: ${currentMessage}\n\nReformulated Standalone Query:` }
    ]
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
    
    if (!response.ok) return currentMessage;

    const data = await response.json();
    const reformulated = data?.choices?.[0]?.message?.content?.trim();
    
    // Fallback securely
    if (!reformulated || reformulated.toLowerCase().startsWith('i am a') || reformulated.length > 200) {
      return currentMessage;
    }
    
    return reformulated;
  } catch (error) {
    return currentMessage;
  }
};

