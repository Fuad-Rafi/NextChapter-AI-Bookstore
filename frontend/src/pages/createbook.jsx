import React from 'react'
import { useEffect, useState } from 'react';
import BackButton from '../components/backbutton';
import axios from '../utils/axios';
import Spinner from '../components/spinner';
import { useNavigate } from 'react-router-dom';


const CreateBook = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverImage('');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImage(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBook = async () => {
    if (!title || !author || !publishedDate) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/books', {
        title,
        author,
        publishedDate: new Date(publishedDate),
        coverImage,
        price: price === '' ? null : Number(price),
      });
      console.log(response.data);
      setLoading(false);
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
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Title</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Author</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 49.99"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Book Cover Image</label>
          <input
            type="file"
            accept="image/*"
            className="w-full p-2 border border-gray-300 rounded bg-white"
            onChange={handleCoverImageChange}
          />
          {coverImage && (
            <img
              src={coverImage}
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
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
          />
        </div>
        <button
          onClick={handleSaveBook}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Book'}
        </button>
      </div>
    </div>
  )
}

export default CreateBook