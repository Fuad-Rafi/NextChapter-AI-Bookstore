"use client";

import Link from 'next/link';

const getDisplayImage = (book) => book?.coverImage || book?.image || '';

function BookCover({ book }) {
  if (!book) {
    return null;
  }

  const image = getDisplayImage(book);

  return (
    <div className="w-64 h-80">
      <div className="relative bg-linear-to-br from-purple-100 via-pink-50 to-cyan-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-cyan-900/30 rounded-lg overflow-hidden aspect-3/4 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
        {image ? (
          <img src={image} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-blue-300 to-purple-300 dark:from-blue-700 dark:to-purple-700 flex items-center justify-center p-4">
            <span className="text-center font-serif text-white font-bold text-sm line-clamp-4">{book.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
          <div className="space-y-2 w-full">
            <Link
              href={`/books/${book._id}`}
              className="block w-full text-center px-3 py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white font-semibold text-sm hover:bg-white dark:hover:bg-gray-700 transition-all"
            >
              View Details
            </Link>
            <Link
              href={`/customer/order/${book._id}`}
              className="block w-full text-center px-3 py-2 rounded-lg bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white font-semibold text-sm hover:shadow-lg transition-all"
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>
      <div className="text-center mt-4">
        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-base">{book.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{book.author || 'Unknown Author'}</p>
        {book.price && <p className="text-base font-bold text-[#D34B4B] dark:text-[#FF6B6B] mt-2">Tk {book.price}</p>}
      </div>
    </div>
  );
}

export default function HeroBookShowcase({ books }) {
  if (!books || books.length < 9) {
    return null;
  }

  const bookIndices = {
    L4: 0,
    L3: 1,
    L2: 2,
    L1: 3,
    CENTER: 4,
    R1: 5,
    R2: 6,
    R3: 7,
    R4: 8,
  };

  const getBook = (key) => books[bookIndices[key]];

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-100 z-50">
        <BookCover book={getBook('CENTER')} />
      </div>
      <div className="absolute top-1/2 left-[38%] -translate-y-1/2 scale-90 z-40 opacity-90">
        <BookCover book={getBook('L1')} />
      </div>
      <div className="absolute top-1/2 left-[30%] -translate-y-1/2 scale-75 z-30 opacity-75 blur-[1px]">
        <BookCover book={getBook('L2')} />
      </div>
      <div className="absolute top-1/2 left-[22%] -translate-y-1/2 scale-60 z-20 opacity-60 blur-[2px]">
        <BookCover book={getBook('L3')} />
      </div>
      <div className="absolute top-1/2 left-[14%] -translate-y-1/2 scale-50 z-10 opacity-40 blur-[2px]">
        <BookCover book={getBook('L4')} />
      </div>
      <div className="absolute top-1/2 right-[38%] -translate-y-1/2 scale-90 z-40 opacity-90">
        <BookCover book={getBook('R1')} />
      </div>
      <div className="absolute top-1/2 right-[30%] -translate-y-1/2 scale-75 z-30 opacity-75 blur-[1px]">
        <BookCover book={getBook('R2')} />
      </div>
      <div className="absolute top-1/2 right-[22%] -translate-y-1/2 scale-60 z-20 opacity-60 blur-[2px]">
        <BookCover book={getBook('R3')} />
      </div>
      <div className="absolute top-1/2 right-[14%] -translate-y-1/2 scale-50 z-10 opacity-40 blur-[2px]">
        <BookCover book={getBook('R4')} />
      </div>
    </div>
  );
}
