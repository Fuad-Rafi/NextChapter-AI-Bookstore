import React from 'react'
import { useEffect, useState } from 'react';
import BackButton from '../components/backbutton';
import axios from 'axios';
import Spinner from '../components/spinner';
import { useNavigate } from 'react-router-dom';


const CreateBook = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveBook = async () => {
    if (!title || !author || !publishedDate) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/books', {
        title,
        author,
        publishedDate: new Date(publishedDate),
      });
      console.log(response.data);
      setLoading(false);
      navigate('/');
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