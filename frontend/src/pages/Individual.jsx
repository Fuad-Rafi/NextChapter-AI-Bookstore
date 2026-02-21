import { useEffect, useState } from 'react';
import BackButton from '../components/backbutton';
import axios from '../utils/axios';
import Spinner from '../components/spinner';
import { useParams } from 'react-router-dom';

const Individual = () => {

  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="p-4">
      <BackButton to="/" />
      <h1 className="text-3xl font-bold mb-4">Details</h1>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <span className="text-gray-400">ID</span>
            <span> {book._id} </span>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <span className="text-gray-400">Title</span>
            <span> {book.title} </span>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <span className="text-gray-400">Author</span>
            <span> {book.author} </span>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <span className="text-gray-400">Publish Year</span>
            <span> {new Date(book.publishedDate).getFullYear()} </span>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <span className="text-gray-400">Last Update time</span>
            <span>
              {book?.updatedAt ? new Date(book.updatedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
          
      )}
      
    </div>
  )
}

export default Individual