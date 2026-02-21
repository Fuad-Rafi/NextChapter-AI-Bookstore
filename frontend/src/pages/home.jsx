import React, { useEffect, useState } from 'react';
import Spinner from '../components/spinner';
import axios from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineEdit } from 'react-icons/ai';
import { BsInfoCircle } from 'react-icons/bs';
import { MdOutlineDelete, MdOutlineAddBox } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/books');
        // Assuming your backend returns { books: [...] }
        setBooks(response.data.books || response.data); 
        setLoading(false);
      } catch (error) {
        console.error('Error fetching books:', error);
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

    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black p-4 md:p-10">
      
      {/* CONTENT CONTAINER: Limits width for better readability on large screens */}
      <div className="w-full max-w-6xl">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Book <span className="text-white">Collection</span>
          </h1>

          <div className="flex items-center gap-3">
            <Link
              to="/books/create"
              className="flex items-center gap-2 bg-white hover:bg-gray-200 text-gray-900 px-8 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-sky-500/40 active:scale-95"
            >
              <MdOutlineAddBox className="text-2xl" />
              <span className="font-bold uppercase tracking-wider">Add New Book</span>
            </Link>

            <Link
              to="/admin/orders"
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-2xl transition-all duration-300"
            >
              Order Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-2xl transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner />
          </div>
        ) : (
          /* TABLE CONTAINER: Card style with glassmorphism */
          <div className="w-full overflow-hidden rounded-3xl border border-gray-700 bg-gray-900/40 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/60 text-gray-400 text-xs md:text-sm uppercase tracking-[0.2em]">
                    <th className="py-6 px-8 font-bold">No.</th>
                    <th className="py-6 px-8 font-bold">Title</th>
                    <th className="py-6 px-8 font-bold max-md:hidden">Author</th>
                    <th className="py-6 px-8 font-bold max-md:hidden text-center">Published</th>
                    <th className="py-6 px-8 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {books.length > 0 ? (
                    books.map((book, index) => (
                      <tr 
                        key={book._id} 
                        className="group hover:bg-white/5 transition-all duration-200"
                      >
                        <td className="py-6 px-8 text-gray-500 font-mono text-sm">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="py-6 px-8 text-white font-semibold text-lg md:text-xl">
                          {book.title}
                        </td>
                        <td className="py-6 px-8 text-gray-300 max-md:hidden">
                          {book.author}
                        </td>
                        <td className="py-6 px-8 text-gray-400 max-md:hidden text-center">
                          {new Date(book.publishedDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex justify-center items-center space-x-6">
                            <Link 
                              to={`/books/${book._id}`} 
                              className="text-sky-400 hover:text-sky-300 transform hover:scale-125 transition-all"
                            >
                              <BsInfoCircle className="text-2xl" />
                            </Link>
                            <Link 
                              to={`/books/edit/${book._id}`} 
                              className="text-emerald-400 hover:text-emerald-300 transform hover:scale-125 transition-all"
                            >
                              <AiOutlineEdit className="text-2xl" />
                            </Link>
                            <Link 
                              to={`/books/delete/${book._id}`} 
                              className="text-rose-500 hover:text-rose-400 transform hover:scale-125 transition-all"
                            >
                              <MdOutlineDelete className="text-2xl" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-20 text-center text-gray-500 text-lg italic">
                        Your library is currently empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FOOTER STATS (Optional extra touch) */}
        {!loading && books.length > 0 && (
          <div className="mt-6 text-gray-500 text-sm text-center md:text-right px-4">
            Showing <span className="text-gray-300 font-bold">{books.length}</span> books in your database
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;