"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Keep a minimal client-side error trace in dev tools only.
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full glass-panel rounded-3xl p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-red-600 mb-2">Something went wrong</p>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Unexpected error</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
          We could not complete that request. You can retry, or return to the home page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-lg bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white font-semibold"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
