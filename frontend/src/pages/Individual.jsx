import { useEffect, useState } from 'react';
import BackButton from '../components/backbutton';
import axios from '../utils/axios';
import Spinner from '../components/spinner';
import { useParams } from 'react-router-dom';

const Individual = () => {

  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatTk = (value) => {
    if (typeof value !== 'number') {
      return 'N/A';
    }

    return `Tk ${value.toFixed(2)}`;
  };

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axios.get(`/books/${id}`);
        setBook(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching books:', error);
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-7">
      <BackButton to="/" />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Details</h1>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">ID</p>
            <p className="mt-1 text-base font-semibold text-gray-900 break-all">{book._id}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Title</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{book.title}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Author</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{book.author}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm md:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-gray-500">Synopsis</p>
            <p className="mt-1 text-base leading-7 text-gray-900 whitespace-pre-line">
              {book.synopsis || book.description || 'No synopsis available yet.'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Price</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{formatTk(book.price)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Publish Year</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{new Date(book.publishedDate).getFullYear()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Last Update Time</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {book?.updatedAt ? new Date(book.updatedAt).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
          
      )}
      
    </div>
  )
}

export default Individual