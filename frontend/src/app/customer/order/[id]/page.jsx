"use client";

import { useEffect, useState } from 'react';
import axios from '../../../../utils/axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../hooks/useAuth';
import { useForm } from 'react-hook-form';

export default function OrderBook() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { name: '', address: '', phone: '' },
  });

  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name) setValue('name', user.name);
  }, [setValue, user]);

  useEffect(() => {
    if (!id) return;
    const fetchBook = async () => {
      try {
        setLoadingBook(true);
        const response = await axios.get(`/books/${id}`);
        setBook(response.data);
      } catch (fetchError) {
        console.error('Error fetching selected book:', fetchError);
      } finally {
        setLoadingBook(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleConfirm = async (values) => {
    setError('');

    if (!values.name.trim() || !values.address.trim() || !values.phone.trim()) {
      setError('Name, address and phone number are required.');
      return;
    }

    if (!book?._id || !book?.title || !book?.author) {
      setError('Selected book data is not available.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/orders', {
        bookId: book._id,
        bookTitle: book.title,
        bookAuthor: book.author,
        customerName: values.name.trim(),
        customerAddress: values.address.trim(),
        customerPhone: values.phone.trim(),
      });

      setSubmittedOrder({
        name: values.name.trim(),
        address: values.address.trim(),
        phone: values.phone.trim(),
      });
      setConfirmed(true);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to save order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans text-gray-800 relative flex items-start justify-center">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-8 relative overflow-hidden mt-10">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10">
          <div className="mb-6">
            <Link href="/" className="text-sm font-medium text-gray-500 hover:text-[#D34B4B] transition-colors">
              &larr; Back to Home
            </Link>
          </div>

          <h1 className="text-3xl font-serif text-gray-800 mb-6 border-b border-gray-200/50 pb-4">Secure Order</h1>

          {loadingBook ? (
            <div className="animate-pulse flex space-x-4 mb-8">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 shadow-sm"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 shadow-sm"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 p-4 rounded-xl border border-white/60 mb-8 shadow-sm text-sm">
              <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold mb-1">Selected Item</p>
              <p className="text-gray-900 font-semibold text-lg">{book?.title || 'Unknown Book'}</p>
              <p className="text-gray-600">{book?.author}</p>
            </div>
          )}

          {!confirmed ? (
            <form onSubmit={handleSubmit(handleConfirm)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required.' })}
                  className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                  placeholder="Your full name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Delivery Address</label>
                <textarea
                  {...register('address', { required: 'Address is required.' })}
                  className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400 resize-none"
                  placeholder="Your full delivery address"
                  rows={3}
                />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="tel"
                  {...register('phone', { required: 'Phone number is required.' })}
                  className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                  placeholder="e.g. +880 123 456 789"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-linear-to-r from-[#D34B4B] to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 mt-4 rounded-xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing Order...' : 'Confirm Order'}
              </button>
            </form>
          ) : (
            <div className="bg-green-50/80 border border-green-200 rounded-2xl p-6 backdrop-blur-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-green-800 mb-2">Order Confirmed!</h2>
              <p className="text-green-700 text-sm mb-4">Thank you for your purchase.</p>
              
              <div className="bg-white/60 p-4 rounded-xl text-left inline-block w-full max-w-sm">
                <p className="text-green-900 text-sm"><span className="font-semibold">Name:</span> {submittedOrder?.name}</p>
                <p className="text-green-900 text-sm mt-1"><span className="font-semibold">Address:</span> {submittedOrder?.address}</p>
                <p className="text-green-900 text-sm mt-1"><span className="font-semibold">Phone:</span> {submittedOrder?.phone}</p>
                <p className="text-green-900 text-sm mt-1"><span className="font-semibold">Item:</span> {book?.title}</p>
              </div>
              
              <div className="mt-8">
                <Link href="/" className="inline-block px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition">
                  Continue Browsing
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
