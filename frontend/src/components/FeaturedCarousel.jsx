"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const getDisplayImage = (book) => book?.coverImage || book?.image || '';

function MiniThumb({ book }) {
  if (!book) {
    return null;
  }

  const image = getDisplayImage(book);

  return (
    <div className="w-26 h-32 lg:w-29 lg:h-35.5 rounded-2xl overflow-hidden shadow-sm bg-[#e8ddd2]">
      {image ? (
        <img
          src={image}
          alt={book.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2 bg-[#cdb9a6]">
          <span className="text-[10px] leading-tight text-center text-[#3d2f25] font-semibold line-clamp-3">
            {book.title}
          </span>
        </div>
      )}
    </div>
  );
}

function MainCard({ book, isCenter = false }) {
  if (!book) {
    return null;
  }

  const image = getDisplayImage(book);

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-[#d4c6b8] shadow-xl transition-all duration-500 ${
        isCenter ? 'w-52 h-72 sm:w-64 sm:h-88 md:w-80 md:h-107.5' : 'w-38 h-56 sm:w-46 sm:h-66 md:w-57.5 md:h-79.5'
      }`}
    >
      {image ? (
        <img
          src={image}
          alt={book.title}
          className="w-full h-full object-cover"
          loading={isCenter ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3 bg-[#c6ab91]">
          <span className="text-center text-[#2e241d] font-semibold text-sm line-clamp-4">{book.title}</span>
        </div>
      )}
    </div>
  );
}

export default function FeaturedCarousel({ books = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const animationTimerRef = useRef(null);
  const indexUpdateTimerRef = useRef(null);
  const ANIMATION_MS = 760;
  const AUTO_SLIDE_MS = 4200;

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      if (indexUpdateTimerRef.current) {
        clearTimeout(indexUpdateTimerRef.current);
      }
    };
  }, []);

  const totalBooks = books.length;

  const triggerSlide = useCallback((direction) => {
    if (isAnimating || totalBooks < 2) {
      return;
    }

    setSlideDirection(direction);
    setIsAnimating(true);

    if (indexUpdateTimerRef.current) {
      clearTimeout(indexUpdateTimerRef.current);
    }
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    indexUpdateTimerRef.current = setTimeout(() => {
      setCurrentIndex((prev) =>
        direction === 'next' ? (prev + 1) % totalBooks : (prev - 1 + totalBooks) % totalBooks
      );
      indexUpdateTimerRef.current = null;
    }, ANIMATION_MS);

    animationTimerRef.current = setTimeout(() => {
      setIsAnimating(false);
      animationTimerRef.current = null;
    }, ANIMATION_MS + 20);
  }, [ANIMATION_MS, isAnimating, totalBooks]);

  useEffect(() => {
    if (totalBooks < 2) {
      return;
    }

    const intervalId = setInterval(() => {
      triggerSlide('next');
    }, AUTO_SLIDE_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [triggerSlide, totalBooks]);

  if (totalBooks === 0) {
    return null;
  }

  const getBookAt = (offset) => books[(currentIndex + offset + totalBooks) % totalBooks];
  const centerBook = getBookAt(0);
  const prevBook = getBookAt(-1);
  const nextBook = getBookAt(1);
  const farLeftOffsets = [-5, -4, -3, -2];
  const farRightOffsets = [2, 3, 4, 5];
  const smoothSlideClass = isAnimating
    ? slideDirection === 'next'
      ? 'carousel-smooth carousel-smooth-next'
      : 'carousel-smooth carousel-smooth-prev'
    : 'carousel-smooth';

  const prevCardMotionClass = isAnimating
    ? slideDirection === 'next'
      ? 'md:-translate-x-16 lg:-translate-x-20 xl:-translate-x-24 opacity-85'
      : 'md:translate-x-56 lg:translate-x-64 xl:translate-x-72 z-20'
    : '';

  const centerCardMotionClass = isAnimating
    ? slideDirection === 'next'
      ? 'md:-translate-x-56 lg:-translate-x-64 xl:-translate-x-72 md:scale-90'
      : 'md:translate-x-56 lg:translate-x-64 xl:translate-x-72 md:scale-90'
    : '';

  const nextCardMotionClass = isAnimating
    ? slideDirection === 'next'
      ? 'md:-translate-x-56 lg:-translate-x-64 xl:-translate-x-72 md:scale-105 z-20'
      : 'md:translate-x-16 lg:translate-x-20 xl:translate-x-24 opacity-85'
    : '';

  return (
    <section className="relative pt-1 sm:pt-2 pb-4 sm:pb-8">
      <div className="max-w-screen-2xl mx-auto px-1 sm:px-4 lg:px-6">
        <div className="relative overflow-visible pt-1 sm:pt-2 md:pt-2 pb-24 sm:pb-28 md:pb-32">
          <div className="relative w-full flex items-start justify-center">
            <div className="hidden md:grid w-full grid-cols-[auto_auto_auto_auto_auto] items-center justify-center gap-x-6 lg:gap-x-10 xl:gap-x-14 px-2 lg:px-5">
              <div className="grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-2 justify-self-end mr-12 lg:mr-14 xl:mr-16">
                {farLeftOffsets.map((offset, index) => (
                  <div
                    key={offset}
                    className={['translate-y-0 -rotate-2', '-translate-y-1 rotate-1', 'translate-y-1 rotate-1', '-translate-y-0.5 -rotate-1'][index]}
                  >
                    <MiniThumb book={getBookAt(offset)} />
                  </div>
                ))}
              </div>

              <div className={`translate-y-2 -rotate-1 justify-self-end transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${prevCardMotionClass}`}>
                <MainCard book={prevBook} />
              </div>
              <div className={`relative z-10 -translate-y-2 rotate-1 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${centerCardMotionClass}`}>
                <MainCard book={centerBook} isCenter />
              </div>
              <div className={`translate-y-1 rotate-1 justify-self-start transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${nextCardMotionClass}`}>
                <MainCard book={nextBook} />
              </div>

              <div className="grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-2 justify-self-start">
                {farRightOffsets.map((offset, index) => (
                  <div
                    key={offset}
                    className={['translate-y-1 rotate-1', '-translate-y-1 -rotate-1', '-translate-y-0.5 rotate-2', 'translate-y-1 -rotate-2'][index]}
                  >
                    <MiniThumb book={getBookAt(offset)} />
                  </div>
                ))}
              </div>
            </div>

            <div className={`md:hidden z-10 ${smoothSlideClass}`}>
              <MainCard book={centerBook} isCenter />
            </div>
          </div>

          <div className={`hidden md:block absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 text-center max-w-72 ${smoothSlideClass}`}>
            <h3 className="font-bold text-[#27211c] text-3xl line-clamp-1">{centerBook?.title}</h3>
            <p className="text-[#8b5e3b] text-2xl mt-1 line-clamp-1">{centerBook?.author || 'Unknown Author'}</p>
          </div>

          <button
            onClick={() => triggerSlide('prev')}
            className="absolute left-[20%] sm:left-[30%] md:left-[calc(50%-166px)] lg:left-[calc(50%-174px)] xl:left-[calc(50%-182px)] top-[50%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 border border-[#dccfbe] text-[#5f4630] hover:bg-white transition shadow-lg"
            aria-label="Previous books"
          >
            <FiChevronLeft className="mx-auto text-xl" />
          </button>

          <button
            onClick={() => triggerSlide('next')}
            className="absolute right-[24%] sm:right-[30%] md:right-auto md:left-[calc(50%+176px)] lg:left-[calc(50%+184px)] xl:left-[calc(50%+192px)] top-[50%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 border border-[#dccfbe] text-[#5f4630] hover:bg-white transition shadow-lg"
            aria-label="Next books"
          >
            <FiChevronRight className="mx-auto text-xl" />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 sm:hidden">
            <Link
              href={`/books/${centerBook?._id}`}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#5a3d26] border border-[#dccfbe]"
            >
              Details
            </Link>
            <Link
              href={`/customer/order/${centerBook?._id}`}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#b3713a] text-white"
            >
              Order
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
