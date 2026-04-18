"use client";

import Link from 'next/link';

export default function GlobalError() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FFFBF9] dark:bg-[#0A0F1C] flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full rounded-3xl bg-white/90 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-red-600 mb-2">Critical application error</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Application unavailable</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
            A critical error occurred while rendering this page.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-lg bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white font-semibold"
          >
            Back home
          </Link>
        </div>
      </body>
    </html>
  );
}
