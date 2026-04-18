"use client";

import { useEffect, useMemo, useState } from 'react';
import axios from '../utils/axios';
import Link from 'next/link';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import Spinner from '../components/spinner';
import FeaturedCarousel from '../components/FeaturedCarousel';

const CACHE_KEY = 'catalogBooksCache';

const toCachedBook = (book) => ({
  _id: book?._id,
  title: book?.title || '',
  author: book?.author || '',
  coverImage: book?.coverImage || '',
  image: book?.image || '',
  price: typeof book?.price === 'number' ? book.price : null,
});

const writeCatalogCache = (books) => {
  try {
    const compactBooks = Array.isArray(books) ? books.map(toCachedBook) : [];
    localStorage.setItem(CACHE_KEY, JSON.stringify(compactBooks));
  } catch (error) {
    // Cache is best-effort only; ignore quota/storage failures.
    console.warn('Unable to cache catalog books:', error?.message || error);
  }
};

const readCatalogCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return [];
    }

    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function CustomerHome() {
  const [books, setBooks] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [booksError, setBooksError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setBooksError('');
        const response = await axios.get('/books');
        const nextBooks = response.data.books || response.data || [];
        setBooks(nextBooks);

        try {
          const featuredResponse = await axios.get('/books/featured/list');
          const nextFeaturedBooks = featuredResponse.data.books || [];
          setFeaturedBooks(nextFeaturedBooks);
        } catch (featuredError) {
          console.warn('Error fetching featured books:', featuredError);
          setFeaturedBooks([]);
        }

        writeCatalogCache(nextBooks);
      } catch (error) {
        console.error('Error fetching books:', error);
        const cachedBooks = readCatalogCache();
        setBooks(cachedBooks);
        setBooksError('Could not load live books from server. Showing cached results when available.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch = (book.title || '').toLowerCase().includes(searchTerm.trim().toLowerCase());
      return matchesSearch;
    });
  }, [books, searchTerm]);

  const getDisplayImage = (book) => book.coverImage || book.image || '';

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-100">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Hero Title */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase font-bold text-yellow-500 mb-2">
            Discover Your Next Favorite
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Explore Amazing <span className="text-transparent bg-clip-text bg-linear-to-r from-[#D34B4B] to-[#FF6B6B]">Books</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Find your next page-turner with our curated collection. Use our Smart Assistant for personalized recommendations.
          </p>
        </div>

        {/* Large Glass Search Bar */}
        <div className="max-w-4xl mx-auto mb-8 relative">
          <div className="glass-panel flex items-center p-2 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-2 px-4 py-3 border-r border-white/20 dark:border-gray-600/50 min-w-45 cursor-pointer hover:bg-white/20 dark:hover:bg-gray-700/20 rounded-lg transition">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">All Categories</span>
              <FiChevronDown className="text-gray-400 dark:text-gray-500 ml-auto" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="flex-1 bg-transparent border-none px-6 py-3 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 text-lg"
            />
            <button className="p-4 bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white hover:shadow-lg rounded-xl transition-all hover:scale-105">
              <FiSearch className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-4 sm:mb-6">
          <Link
            href="/assistant"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-linear-to-r from-[#B82020] via-[#D53A3A] to-[#FF5A5A] text-white text-sm md:text-base font-semibold tracking-wide shadow-[0_10px_28px_rgba(200,45,45,0.35)] hover:shadow-[0_12px_34px_rgba(200,45,45,0.45)] hover:scale-105 active:scale-100 transition-all duration-300"
          >
            Get Personalized AI Recommendation
          </Link>
        </div>

        {/* Featured Carousel */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : books.length < 5 ? (
          <div className="glass-panel rounded-2xl p-10 text-center text-gray-500 dark:text-gray-400">
            {booksError || 'Need at least 5 books to display carousel.'}
          </div>
        ) : (
          <FeaturedCarousel books={featuredBooks.length >= 5 ? featuredBooks : books} />
        )}

        {/* Full Grid */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Collection</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">Browse all {filteredBooks.length} books</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : filteredBooks.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center text-gray-500 dark:text-gray-400">
              {booksError || 'No records found.'}
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBooks.map((book) => {
                const image = getDisplayImage(book);
                return (
                  <div key={book._id} className="group">
                    <div className="relative mb-4 bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-xl overflow-hidden aspect-3/4 shadow-md hover:shadow-xl transition-all transform group-hover:-translate-y-1.5">
                      {image ? (
                        <img
                          src={image}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-rose-300 to-indigo-300 dark:from-rose-700 dark:to-indigo-700 flex items-center justify-center p-3">
                          <span className="text-center font-serif text-white font-bold text-xs">{book.title}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="space-y-2 w-full">
                          <Link
                            href={`/books/${book._id}`}
                            className="block w-full text-center px-2 py-1.5 rounded text-xs bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white font-semibold hover:bg-white dark:hover:bg-gray-700 transition-all"
                          >
                            View
                          </Link>
                          <Link
                            href={`/customer/order/${book._id}`}
                            className="block w-full text-center px-2 py-1.5 rounded text-xs bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white font-semibold hover:shadow-lg transition-all"
                          >
                            Order
                          </Link>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-xs">{book.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{book.author || 'Unknown'}</p>
                    {book.price && <p className="text-xs font-bold text-[#D34B4B] dark:text-[#FF6B6B] mt-1">Tk {book.price}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
