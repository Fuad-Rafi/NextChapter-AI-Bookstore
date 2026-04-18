"use client";

import { useState } from 'react';
import BackButton from '../../../../components/backbutton';
import axios from '../../../../utils/axios';
import Spinner from '../../../../components/spinner';
import { useParams, useRouter } from 'next/navigation';
import { FiAlertTriangle } from 'react-icons/fi';

export default function Deletebook() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeletebook = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.delete(`/books/${id}`);
      router.push('/admin/home');
    } catch (err) {
      console.error('Error deleting book:', err);
      setError('Failed to delete book. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans text-gray-800 relative flex justify-center items-start pt-20">
      <div className="w-full max-w-lg glass-panel text-center rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-red-500 to-red-700"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full flex justify-start pb-4 border-b border-gray-200/50 mb-6 w-full">
             <BackButton to="/admin/home" />
          </div>
          
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
            <FiAlertTriangle className="text-3xl text-red-500" />
          </div>

          <h1 className="text-2xl font-serif text-gray-800 mb-2">Delete Validation</h1>
          
          {loading ? (
             <div className="py-6"><Spinner /></div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-8 max-w-sm">
                You are about to permanently delete this book from the database. This action cannot be undone.
              </p>
              
              {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded border border-red-200">{error}</p>}

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => router.push('/admin/home')}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletebook}
                  className="flex-1 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/30"
                >
                  Delete Book
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
