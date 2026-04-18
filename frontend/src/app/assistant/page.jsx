"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import axios from '../../utils/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMessageSquare, FiSend, FiThumbsDown, FiThumbsUp, FiArrowLeft } from 'react-icons/fi';
import Spinner from '../../components/spinner';

const SUGGESTED_PROMPTS = [
  'I like fast-paced mystery books under Tk 400.',
  'Suggest short thriller books with strong plots.',
  'Recommend books similar to my recent interests.',
  'Show me budget-friendly books for weekend reading.',
];

export default function AssistantPage() {
  const router = useRouter();

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Tell me what genres, mood, or budget you want, and I will recommend books from your catalog.',
    },
  ]);
  const [assistantRecommendations, setAssistantRecommendations] = useState([]);
  const [feedbackState, setFeedbackState] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Client-side initialization for localStorage
    try {
      setConversationId(localStorage.getItem('conversationId') || '');
      const savedMsg = localStorage.getItem('chatMessages');
      if (savedMsg) setChatMessages(JSON.parse(savedMsg));
      const savedRecs = localStorage.getItem('assistantRecommendations');
      if (savedRecs) setAssistantRecommendations(JSON.parse(savedRecs));
    } catch {
      setConversationId('');
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, chatLoading]);

  // Persist conversation state to localStorage
  useEffect(() => {
    try {
      if (conversationId) localStorage.setItem('conversationId', conversationId);
    } catch {
      // Ignore localStorage write errors.
    }
  }, [conversationId]);

  useEffect(() => {
    try {
      if (chatMessages.length > 1) localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    } catch {
      // Ignore localStorage write errors.
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      if (assistantRecommendations.length > 0) {
        localStorage.setItem('assistantRecommendations', JSON.stringify(assistantRecommendations));
      }
    } catch {
      // Ignore localStorage write errors.
    }
  }, [assistantRecommendations]);

  const sendFeedback = async ({ eventType, bookId }) => {
    if (!bookId) return;
    try {
      await axios.post('/assistant/feedback', {
        conversationId: conversationId || undefined,
        eventType,
        bookId,
      });
      setFeedbackState((previous) => ({
        ...previous,
        [bookId]: { ...(previous[bookId] || {}), [eventType]: true },
      }));
    } catch {
      // Ignore feedback telemetry errors in UI flow.
    }
  };

  const sendChatMessage = async (messageText) => {
    const message = String(messageText || '').trim();
    if (!message || chatLoading) return;

    setChatLoading(true);
    setChatMessages((previous) => [...previous, { role: 'user', content: message }]);
    setChatInput('');

    try {
      const response = await axios.post('/assistant/chat', {
        message,
        conversationId: conversationId || undefined,
        limit: 5,
      });

      setConversationId(response.data.conversationId || conversationId);
      setAssistantRecommendations(response.data.recommendations || []);
      setChatMessages((previous) => [
        ...previous,
        { role: 'assistant', content: response.data.assistantMessage || 'I could not prepare a response right now.' },
      ]);
    } catch {
      setChatMessages((previous) => [
        ...previous,
        { role: 'assistant', content: 'I could not process that request. Please retry with a short preference prompt.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    await sendChatMessage(chatInput);
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-100">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button & Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors mb-6"
          >
            <FiArrowLeft />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-linear-to-br from-[#D34B4B] to-[#FF6B6B] rounded-xl shadow-lg">
                <FiMessageSquare className="text-2xl text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Smart Assistant</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 ml-12 text-sm">Get personalized book recommendations powered by AI</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Main Chat Area */}
          <div className="glass-panel sticky top-8 flex max-h-[calc(100vh-10rem)] flex-col rounded-3xl overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/40 dark:border-gray-700 bg-linear-to-r from-white/40 dark:from-gray-800/40 to-white/20 dark:to-gray-900/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-linear-to-r from-green-400 to-cyan-400 animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversation Active</span>
              </div>
              {conversationId && (
                <span className="text-xs text-gray-500 dark:text-gray-400">ID: {conversationId.slice(-6)}</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {chatMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                    message.role === 'user'
                      ? 'bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white rounded-br-none'
                      : 'bg-linear-to-r from-blue-50 dark:from-blue-900/30 to-cyan-50 dark:to-cyan-900/30 text-gray-800 dark:text-gray-100 border border-blue-200 dark:border-blue-700/50 rounded-bl-none backdrop-blur-sm'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-linear-to-r from-purple-50 dark:from-purple-900/30 to-pink-50 dark:to-pink-900/30 text-gray-600 dark:text-gray-300 border border-purple-200 dark:border-purple-700/50 rounded-2xl rounded-bl-none px-4 py-3 text-sm backdrop-blur-sm animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            {chatMessages.length === 1 && !chatLoading && (
              <div className="border-t border-white/40 dark:border-gray-700 bg-white/20 dark:bg-gray-800/20 px-6 py-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Try asking:</p>
                <div className="space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendChatMessage(prompt)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/70 border border-white/40 dark:border-gray-600 transition-all hover:shadow-md"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-t border-white/40 dark:border-gray-700 p-4">
              <form onSubmit={handleChatSubmit} className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="What kind of book are you looking for?"
                  className="w-full bg-white/70 dark:bg-gray-700/70 border border-white/60 dark:border-gray-600 rounded-full px-5 py-3 pr-12 text-sm text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/40 transition shadow-inner dark:shadow-inner dark:shadow-gray-900"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center rounded-full bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white transition hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <FiSend className="text-sm -ml-0.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Recommendations Sidebar */}
          <div>
            {assistantRecommendations.length > 0 && (
              <div className="glass-panel rounded-3xl overflow-hidden sticky top-8">
                <div className="border-b border-white/40 dark:border-gray-700 bg-linear-to-r from-amber-50 dark:from-amber-900/30 to-orange-50 dark:to-orange-900/30 px-6 py-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-amber-400 to-orange-500"></span>
                    Recommended For You
                  </h3>
                </div>
                <div className="p-4 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {assistantRecommendations.map((book) => {
                    const feedback = feedbackState[book._id] || {};
                    return (
                      <div key={book._id} className="group bg-linear-to-br from-white/60 dark:from-gray-700/60 to-white/40 dark:to-gray-800/40 border border-white/50 dark:border-gray-600/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
                        <p className="font-bold text-sm text-gray-800 dark:text-white line-clamp-2">{book.title}</p>
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{book.synopsis || 'No synopsis available.'}</p>
                        {book.price && <p className="mt-2 text-xs font-semibold text-[#D34B4B] dark:text-[#FF6B6B]">Tk {book.price}</p>}
                        <div className="mt-3 flex items-center gap-1.5">
                          <button
                            onClick={() => sendFeedback({ eventType: 'like', bookId: book._id })}
                            className={`p-2 rounded-lg border transition-all flex-1 flex justify-center ${
                              feedback.like
                                ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                                : 'bg-white/50 dark:bg-gray-600/50 border-white/40 dark:border-gray-500 text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                            }`}
                          >
                            <FiThumbsUp size={14} />
                          </button>
                          <button
                            onClick={() => sendFeedback({ eventType: 'dislike', bookId: book._id })}
                            className={`p-2 rounded-lg border transition-all flex-1 flex justify-center ${
                              feedback.dislike
                                ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                                : 'bg-white/50 dark:bg-gray-600/50 border-white/40 dark:border-gray-500 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                            }`}
                          >
                            <FiThumbsDown size={14} />
                          </button>
                          <Link
                            href={`/books/${book._id}`}
                            onClick={() => sendFeedback({ eventType: 'click', bookId: book._id })}
                            className="text-[11px] font-bold uppercase tracking-wider text-white px-2 py-2 flex-2 text-center rounded-lg bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] hover:from-red-700 hover:to-red-600 transition-all shadow-md"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
