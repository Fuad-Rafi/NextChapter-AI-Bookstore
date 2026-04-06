import { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/spinner';
import { useAuth } from '../hooks/useAuth';
import { FiGrid, FiList, FiMessageSquare, FiSend, FiThumbsDown, FiThumbsUp } from 'react-icons/fi';

const SUGGESTED_PROMPTS = [
  'I like fast-paced mystery books under Tk 400.',
  'Suggest short thriller books with strong plots.',
  'Recommend books similar to my recent interests.',
  'Show me budget-friendly books for weekend reading.',
];

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [books, setBooks] = useState([]);
  const [booksError, setBooksError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [conversationId, setConversationId] = useState(() => {
    // Load from localStorage to restore session
    return localStorage.getItem('conversationId') || '';
  });
  const [chatMessages, setChatMessages] = useState(() => {
    // Load from localStorage to restore session
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [
      {
        role: 'assistant',
        content: 'Tell me what genres, mood, or budget you want, and I will recommend books from your catalog.',
      },
    ];
  });
  const [assistantRecommendations, setAssistantRecommendations] = useState(() => {
    // Load from localStorage to restore session
    const saved = localStorage.getItem('assistantRecommendations');
    return saved ? JSON.parse(saved) : [];
  });
  const [feedbackState, setFeedbackState] = useState({});
  const [profileSnapshot, setProfileSnapshot] = useState(() => {
    // Load from localStorage to restore session
    const saved = localStorage.getItem('profileSnapshot');
    return saved ? JSON.parse(saved) : null;
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setBooksError('');
        const response = await axios.get('/books');
        const nextBooks = response.data.books || response.data || [];
        setBooks(nextBooks);
        localStorage.setItem('catalogBooksCache', JSON.stringify(nextBooks));
      } catch (error) {
        console.error('Error fetching books:', error);
        const cached = localStorage.getItem('catalogBooksCache');
        if (cached) {
          try {
            setBooks(JSON.parse(cached));
          } catch {
            setBooks([]);
          }
        }
        setBooksError('Could not load live books from server. Showing cached results when available.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, chatLoading]);

  // Persist conversation state to localStorage
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('conversationId', conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('assistantRecommendations', JSON.stringify(assistantRecommendations));
  }, [assistantRecommendations]);

  useEffect(() => {
    if (profileSnapshot) {
      localStorage.setItem('profileSnapshot', JSON.stringify(profileSnapshot));
    }
  }, [profileSnapshot]);

  const handleLogout = () => {
    // Clear conversation session from localStorage
    localStorage.removeItem('conversationId');
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('assistantRecommendations');
    localStorage.removeItem('profileSnapshot');
    logout();
    navigate('/login', { replace: true });
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const status = String(book.status || (book.publishedDate ? 'published' : 'draft')).toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesSearch = (book.title || '').toLowerCase().includes(searchTerm.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [books, filter, searchTerm]);

  const getStatus = (book) => String(book.status || (book.publishedDate ? 'published' : 'draft')).toLowerCase();

  const getDisplayImage = (book) => book.coverImage || book.image || '';

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '-';
    return `Tk ${value.toFixed(2)}`;
  };

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
        [bookId]: {
          ...(previous[bookId] || {}),
          [eventType]: true,
        },
      }));
    } catch (error) {
      console.error('Feedback request failed:', error);
    }
  };

  const sendChatMessage = async (messageText) => {
    const message = String(messageText || '').trim();
    if (!message || chatLoading) {
      return;
    }

    setChatLoading(true);
    setChatError('');
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
      setProfileSnapshot(response.data.profileSnapshot || null);
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: response.data.assistantMessage || 'I could not prepare a response right now.',
        },
      ]);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        'Assistant is unavailable right now. Please try again in a moment.';

      setChatError(errorMessage);
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: 'I could not process that request. Please retry with a short preference prompt.',
        },
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-7">
      <div className="mx-auto w-full max-w-360">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500">Welcome {user?.name || 'Customer'}</p>
          </div>
          <div className="w-full md:max-w-xl">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search books by name"
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleLogout}
            className="w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-md px-3 py-2 ${filter === 'all' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/70'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('published')}
                  className={`rounded-md px-3 py-2 ${filter === 'published' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/70'}`}
                >
                  Published
                </button>
                <button
                  onClick={() => setFilter('draft')}
                  className={`rounded-md px-3 py-2 ${filter === 'draft' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/70'}`}
                >
                  Draft
                </button>
              </div>

              <div className="flex items-center gap-2 text-gray-500">
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-200'}`}
                >
                  <FiList className="text-lg" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-1.5 ${viewMode === 'grid' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-200'}`}
                >
                  <FiGrid className="text-lg" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
                {booksError || 'No products found.'}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4'}>
                {filteredBooks.map((book) => {
                  const status = getStatus(book);
                  const image = getDisplayImage(book);

                  return (
                    <div key={book._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                      <div className="mb-4 flex h-56 items-center justify-center rounded-lg bg-gray-50">
                        {image ? (
                          <img src={image} alt={book.title} className="h-full w-auto rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-44 w-32 items-center justify-center rounded-md bg-gray-900 px-3 text-center text-xs font-semibold text-white">
                            {book.title}
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          ● {status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      <h2 className="line-clamp-2 text-2xl text-gray-900">{book.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                        {book.synopsis || book.description || 'No synopsis available.'}
                      </p>

                      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-200 pt-3 text-sm">
                        <div>
                          <p className="text-gray-500">Price</p>
                          <p className="font-medium text-gray-900">{formatCurrency(book.price)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Details</p>
                          <Link
                            to={`/books/${book._id}`}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            View Details
                          </Link>
                        </div>
                        <div>
                          <p className="text-gray-500">Order</p>
                          <Link
                            to={`/customer/order/${book._id}`}
                            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            Order Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="min-w-0">
            <div className="sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FiMessageSquare className="text-lg text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Book Assistant</h2>
                </div>
                {conversationId ? (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">Live</span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">New Chat</span>
                )}
              </div>

              <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                    className={`rounded-xl px-3 py-2 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'ml-6 bg-blue-600 text-white'
                        : 'mr-6 bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                ))}

                {chatLoading ? (
                  <div className="mr-6 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600">
                    Thinking about your next recommendation...
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 px-4 py-3">
                {chatMessages.some((msg) => msg.role === 'user') ? null : (
                  <>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Try a quick prompt</p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendChatMessage(prompt)}
                          disabled={chatLoading}
                          className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 transition hover:border-blue-400 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <form onSubmit={handleChatSubmit} className="space-y-2">
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Describe your mood, genre, or budget..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    <FiSend className="text-sm" />
                    Send Message
                  </button>
                </form>

                {chatError ? <p className="mt-2 text-xs text-red-600">{chatError}</p> : null}
                {profileSnapshot ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Memory: likes {profileSnapshot.preferredGenres?.join(', ') || 'not set'}; avoids{' '}
                    {profileSnapshot.dislikedGenres?.join(', ') || 'not set'}; authors{' '}
                    {profileSnapshot.preferredAuthors?.join(', ') || 'not set'}.
                  </p>
                ) : null}
              </div>

              <div className="flex-1 overflow-y-auto border-t border-gray-200 px-4 py-3">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recommended For You</h3>
                {assistantRecommendations.length === 0 ? (
                  <p className="text-sm text-gray-500">Send a message to get personalized recommendations.</p>
                ) : (
                  <div className="space-y-3">
                    {assistantRecommendations.map((book) => {
                      const feedback = feedbackState[book._id] || {};

                      return (
                        <div key={book._id} className="rounded-lg border border-gray-200 p-3">
                          <p className="font-semibold text-gray-900">{book.title}</p>
                          <p className="text-xs text-gray-500">{book.author}</p>
                          <p className="mt-1 text-xs text-gray-600">{book.synopsis || 'No synopsis available.'}</p>
                          <p className="mt-2 text-sm font-medium text-gray-900">{formatCurrency(book.price)}</p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => sendFeedback({ eventType: 'like', bookId: book._id })}
                              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                                feedback.like ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-700'
                              }`}
                            >
                              <FiThumbsUp /> Like
                            </button>
                            <button
                              onClick={() => sendFeedback({ eventType: 'dislike', bookId: book._id })}
                              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                                feedback.dislike ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-gray-300 text-gray-700'
                              }`}
                            >
                              <FiThumbsDown /> Dislike
                            </button>
                            <Link
                              to={`/books/${book._id}`}
                              onClick={() => sendFeedback({ eventType: 'click', bookId: book._id })}
                              className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs text-blue-700"
                            >
                              View Details
                            </Link>
                            <Link
                              to={`/customer/order/${book._id}`}
                              onClick={() => sendFeedback({ eventType: 'view', bookId: book._id })}
                              className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                            >
                              Order
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
