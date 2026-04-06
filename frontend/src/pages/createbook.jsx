import React from 'react'
import { useState } from 'react';
import BackButton from '../components/backbutton';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';


const CreateBook = () => {
  const navigate = useNavigate();
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
      const response = await axios.post('/books', {
        title: values.title,
        author: values.author,
        synopsis: values.synopsis,
        description: values.synopsis,
        publishedDate: new Date(values.publishedDate),
        coverImage: values.coverImage,
        price: values.price === '' ? null : Number(values.price),
      });
      console.log(response.data);
      setLoading(false);
      reset();
      setCoverImagePreview('');
      navigate('/admin/home');
    } catch (error) {
      console.error('Error creating book:', error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <BackButton to="/" />
      <h1 className="text-3xl font-bold mb-4">Create New Book</h1>
      <form onSubmit={handleSubmit(handleSaveBook)} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Title</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            {...register('title', { required: 'Title is required.' })}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Author</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            {...register('author', { required: 'Author is required.' })}
          />
          {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Synopsis</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded"
            rows={5}
            {...register('synopsis', { required: 'Synopsis is required.' })}
            placeholder="Short summary of what this book is about"
          />
          {errors.synopsis && <p className="mt-1 text-sm text-red-600">{errors.synopsis.message}</p>}
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Price</label>
          <input
            type="number"
            min="200"
            max="700"
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded"
            {...register('price')}
            placeholder="e.g. 499"
          />
          <p className="mt-1 text-xs text-gray-500">Price must stay between Tk 200 and Tk 700.</p>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Book Cover Image</label>
          <input
            type="file"
            accept="image/*"
            className="w-full p-2 border border-gray-300 rounded bg-white"
            onChange={handleCoverImageChange}
          />
          {coverImagePreview && (
            <img
              src={coverImagePreview}
              alt="Cover preview"
              className="mt-3 h-48 w-32 rounded-md border border-gray-300 object-cover"
            />
          )}
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Published Date</label>
          <input
            type="date"
            className="w-full p-2 border border-gray-300 rounded"
            {...register('publishedDate', { required: 'Published date is required.' })}
          />
          {errors.publishedDate && <p className="mt-1 text-sm text-red-600">{errors.publishedDate.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Book'}
        </button>
      </form>
    </div>
  )
}

export default CreateBook