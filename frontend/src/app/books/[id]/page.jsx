"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BackButton from '../../../components/backbutton';
import axios from '../../../utils/axios';
import Spinner from '../../../components/spinner';

export default function BookIndividual() {
  const params = useParams();
  const id = params?.id;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatTk = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `Tk ${value.toFixed(2)}`;
  };

  useEffect(() => {
    if (!id) return;
    const fetchBook = async () => {
      try {
        const response = await axios.get(`/books/${id}`);
        setBook(response.data);
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans text-gray-800 relative">
      <div className="max-w-4xl mx-auto glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>
        
        <div className="relative z-10">
          <BackButton to="/" />
          
          <h1 className="text-4xl font-serif text-gray-800 mb-8 border-b border-gray-200/50 pb-4">Book Details</h1>
          
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : !book ? (
            <div className="text-center text-gray-500 py-10">Book not found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID</p>
                <p className="mt-1 text-sm font-semibold text-gray-800 break-all">{book._id}</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Title</p>
                <p className="mt-1 text-base font-semibold text-gray-800">{book.title}</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Author</p>
                <p className="mt-1 text-base font-semibold text-gray-800">{book.author}</p>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white/60 shadow-sm md:col-span-2 lg:col-span-3 transition hover:shadow-md">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Synopsis</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {book.synopsis || book.description || 'No synopsis available yet.'}
                </p>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price</p>
                <p className="mt-1 text-lg font-bold text-[#D34B4B]">{formatTk(book.price)}</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Publish Year</p>
                <p className="mt-1 text-base font-semibold text-gray-800">{book.publishedDate ? new Date(book.publishedDate).getFullYear() : 'N/A'}</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/60 shadow-sm transition hover:shadow-md">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {book?.updatedAt ? new Date(book.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
