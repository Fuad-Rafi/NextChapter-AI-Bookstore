"use client";

import React, { useState } from 'react';
import BackButton from '../../../components/backbutton';
import axios from '../../../utils/axios';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

export default function CreateBook() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      author: '',
      synopsis: '',
      publishedDate: '',
      price: '',
      coverImage: '',
    },
  });
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverImagePreview('');
      setValue('coverImage', '');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = typeof reader.result === 'string' ? reader.result : '';
      setCoverImagePreview(imageData);
      setValue('coverImage', imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBook = async (values) => {
    if (!values.title || !values.author || !values.publishedDate) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/books', {
        title: values.title,
        author: values.author,
        synopsis: values.synopsis,
        description: values.synopsis,
        publishedDate: new Date(values.publishedDate),
        coverImage: values.coverImage,
        price: values.price === '' ? null : Number(values.price),
      });
      setLoading(false);
      reset();
      setCoverImagePreview('');
      router.push('/admin/home');
    } catch (error) {
      console.error('Error creating book:', error);
      const message = error?.response?.data?.message || 'Failed to create book. Please check the network tab or server logs.';
      alert(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans text-gray-800 relative flex justify-center">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[200px] bg-linear-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10">
          <BackButton to="/admin/home" />
          
          <h1 className="text-3xl font-serif text-gray-800 mb-6 border-b border-gray-200/50 pb-4">Create New Book</h1>
          
          <form onSubmit={handleSubmit(handleSaveBook)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Title</label>
              <input
                type="text"
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                placeholder="The Catcher in the Rye"
                {...register('title', { required: 'Title is required.' })}
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Author</label>
              <input
                type="text"
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                placeholder="J.D. Salinger"
                {...register('author', { required: 'Author is required.' })}
              />
              {errors.author && <p className="mt-1 text-xs text-red-600">{errors.author.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Synopsis</label>
              <textarea
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400 resize-none"
                rows={5}
                {...register('synopsis', { required: 'Synopsis is required.' })}
                placeholder="Short summary of what this book is about..."
              />
              {errors.synopsis && <p className="mt-1 text-xs text-red-600">{errors.synopsis.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Price (Tk)</label>
              <input
                type="number"
                min="200"
                max="700"
                step="0.01"
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                {...register('price')}
                placeholder="499"
              />
              <p className="mt-1 text-[10px] uppercase font-bold tracking-widest text-[#D34B4B]/80">Budget allowed: Tk 200 - Tk 700</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Date of Publication</label>
              <input
                type="date"
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm"
                {...register('publishedDate', { required: 'Published date is required.' })}
              />
              {errors.publishedDate && <p className="mt-1 text-xs text-red-600">{errors.publishedDate.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Book Cover Image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full bg-white/50 border border-white/70 text-gray-600 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#D34B4B] file:text-white hover:file:bg-red-700"
                onChange={handleCoverImageChange}
              />
              {coverImagePreview && (
                <div className="mt-4 p-2 bg-white/50 rounded-xl border border-white/60 inline-block shadow-sm">
                   <img
                     src={coverImagePreview}
                     alt="Cover preview"
                     className="max-h-48 w-auto rounded-lg object-cover shadow-inner"
                   />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200/50">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-[#D34B4B] to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing Book...' : 'Create Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
