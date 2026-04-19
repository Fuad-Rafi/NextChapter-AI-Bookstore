"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Spinner from '../../../components/spinner';
import axios from '../../../utils/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MdOutlineAddBox } from 'react-icons/md';
import { FiGrid, FiList, FiStar } from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';

export default function AdminHome() {
  const router = useRouter();
  const { logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [featureUpdating, setFeatureUpdating] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/books');
      setBooks(response.data.books || response.data); 
      setLoading(false);
    } catch (error) {
      console.error('Error fetching books:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const status = String(book.status || (book.publishedDate ? 'published' : 'draft')).toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesSearch = (book.title || '').toLowerCase().includes(searchTerm.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [books, filter, searchTerm]);

  const getDisplayImage = (book) => book.coverImage || book.image || '';
  const getStatus = (book) => String(book.status || (book.publishedDate ? 'published' : 'draft')).toLowerCase();
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '-';
    return `Tk ${value.toFixed(2)}`;
  };

  const handleAddFeaturedBook = async () => {
    if (!selectedBookId) {
      alert('Select a book card first, then click Add Featured Book.');
      return;
    }

    try {
      setFeatureUpdating(true);
      const response = await axios.post(`/books/${selectedBookId}/feature`);
      const replacedInfo = response.data?.replacedBookId
        ? ` and replaced one existing featured book.`
        : '.';
      alert(`Book added to featured carousel${replacedInfo}`);
    } catch (error) {
      console.error('Error adding featured book:', error);
      alert(error?.response?.data?.message || 'Failed to add featured book.');
    } finally {
      setFeatureUpdating(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[200px] bg-linear-to-b from-white/40 to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/50 pb-6">
            <h1 className="text-3xl font-serif text-gray-800">Admin Dashboard</h1>
            
            <div className="w-full md:max-w-md">
              <div className="relative">
                 <input
                   type="text"
                   value={searchTerm}
                   onChange={(event) => setSearchTerm(event.target.value)}
                   placeholder="Search library catalog"
                   className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-inner placeholder:text-gray-400"
                 />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/books/create"
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#D34B4B] to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:from-red-600 hover:to-red-800 transition shadow-lg shadow-red-500/30"
              >
                <MdOutlineAddBox className="text-xl" />
                New Book
              </Link>
              <button
                onClick={handleAddFeaturedBook}
                disabled={featureUpdating}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-amber-600 hover:to-yellow-600 transition shadow-lg disabled:opacity-60"
              >
                <FiStar className="text-lg" />
                {featureUpdating ? 'Adding...' : 'Add Featured Book'}
              </button>
              <Link
                href="/admin/orders"
                className="rounded-xl border border-white/80 bg-white/60 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white hover:text-[#D34B4B] transition shadow-sm"
              >
                Order Dashboard
              </Link>
              <button
                onClick={fetchBooks}
                className="rounded-xl border border-white/80 bg-white/60 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white hover:text-blue-600 transition shadow-sm"
              >
                Refresh List
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/80 bg-white/60 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/30 backdrop-blur-sm border border-white/50 p-2 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-sm w-full sm:w-auto overflow-x-auto px-2">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-4 py-1.5 font-medium transition ${filter === 'all' ? 'bg-white shadow-sm text-[#D34B4B]' : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`rounded-lg px-4 py-1.5 font-medium transition ${filter === 'published' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'}`}
              >
                Published
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`rounded-lg px-4 py-1.5 font-medium transition ${filter === 'draft' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'}`}
              >
                Draft
              </button>
            </div>

            <div className="flex items-center gap-2 px-2">
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 transition ${viewMode === 'list' ? 'bg-white shadow-sm text-[#D34B4B]' : 'text-gray-500 hover:bg-white/50'}`}
              >
                <FiList className="text-xl" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#D34B4B]' : 'text-gray-500 hover:bg-white/50'}`}
              >
                <FiGrid className="text-xl" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-2xl border border-white/50 bg-white/40 p-16 text-center text-gray-500 font-medium">
              No products found matches your criteria.
            </div>
          ) : (
             <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid gap-4'}>
              {filteredBooks.map((book) => {
                const status = getStatus(book);
                const image = getDisplayImage(book);

                return (
                  <div
                    key={book._id}
                    onClick={() => setSelectedBookId(book._id)}
                    className={`group relative rounded-2xl border bg-white/40 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col h-full backdrop-blur-sm cursor-pointer ${
                      selectedBookId === book._id
                        ? 'border-amber-400 ring-2 ring-amber-300/70'
                        : 'border-white/60'
                    }`}
                  >
                    <div className="mb-5 flex h-48 sm:h-56 items-center justify-center rounded-xl bg-white/60 shadow-inner overflow-hidden relative">
                      {image ? (
                        <img src={image} alt={book.title} className="max-h-full w-auto object-cover transform transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-3/4 w-2/3 items-center justify-center rounded-lg bg-gray-200 shadow-sm px-4 text-center text-xs font-serif text-gray-500">
                          {book.title}
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2">
                         <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            status === 'published' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                         }`}>
                           {status === 'published' ? 'Published' : 'Draft'}
                         </span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                       <Link href={`/books/${book._id}`} className="font-bold text-lg text-gray-800 line-clamp-2 hover:text-[#D34B4B] transition-colors leading-snug">
                         {book.title}
                       </Link>
                       <p className="mt-2 text-xs text-gray-500 line-clamp-3 leading-relaxed">
                         {book.synopsis || book.description || 'No synopsis available.'}
                       </p>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-200/50 pt-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Price</p>
                        <p className="font-bold text-[#D34B4B] text-sm">{formatCurrency(book.price)}</p>
                      </div>
                      <Link
                        href={`/books/edit/${book._id}`}
                        className="flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-[#D34B4B] bg-white/60 border border-white hover:bg-white shadow-sm rounded-lg transition"
                      >
                        Edit
                      </Link>
                      <Link
                         href={`/books/delete/${book._id}`}
                         className="flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition"
                      >
                         Delete
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
