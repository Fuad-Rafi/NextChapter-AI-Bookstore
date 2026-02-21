import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/spinner';
import { useAuth } from '../hooks/useAuth';

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/books');
        setBooks(response.data.books || response.data || []);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Home</h1>
          <p className="text-gray-600">Welcome {user?.name || 'Customer'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black"
        >
          Logout
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">No</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Author</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, index) => (
                <tr key={book._id} className="border-t">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{book.title}</td>
                  <td className="p-3">{book.author}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <Link to={`/books/${book._id}`} className="text-blue-600 font-medium hover:underline">
                        Specific
                      </Link>
                      <Link
                        to={`/customer/order/${book._id}`}
                        className="text-green-700 font-medium hover:underline"
                      >
                        Order
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
