import { useEffect, useMemo, useState } from 'react';
import axios from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/spinner';
import { useAuth } from '../hooks/useAuth';
import { FiGrid, FiList } from 'react-icons/fi';

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const status = String(book.status || (book.publishedDate ? 'published' : 'draft')).toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesSearch = (book.title || '').toLowerCase().includes(searchTerm.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [books, filter, searchTerm]);

  const getStatus = (book) => String(book.status || (book.publishedDate ? 'published' : 'draft')).toLowerCase();

  const getDisplayImage = (book) => book.coverImage || book.image || '';

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '-';
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-7">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500">Welcome {user?.name || 'Customer'}</p>
          </div>
          <div className="w-full md:max-w-xl">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search books by name"
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleLogout}
            className="w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-3 py-2 ${filter === 'all' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/70'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`rounded-md px-3 py-2 ${filter === 'published' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/70'}`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`rounded-md px-3 py-2 ${filter === 'draft' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200/70'}`}
            >
              Draft
            </button>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-200'}`}
            >
              <FiList className="text-lg" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1.5 ${viewMode === 'grid' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-200'}`}
            >
              <FiGrid className="text-lg" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
            No products found.
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-4'}>
            {filteredBooks.map((book) => {
              const status = getStatus(book);
              const image = getDisplayImage(book);

              return (
                <div key={book._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                  <div className="mb-4 flex h-56 items-center justify-center rounded-lg bg-gray-50">
                    {image ? (
                      <img src={image} alt={book.title} className="h-full w-auto rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-44 w-32 items-center justify-center rounded-md bg-gray-900 px-3 text-center text-xs font-semibold text-white">
                        {book.title}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                        status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      ● {status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <h2 className="line-clamp-2 text-2xl text-gray-900">{book.title}</h2>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-200 pt-3 text-sm">
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-medium text-gray-900">{formatCurrency(book.price)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Details</p>
                      <Link
                        to={`/books/${book._id}`}
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                    <div>
                      <p className="text-gray-500">Order</p>
                      <Link
                        to={`/customer/order/${book._id}`}
                        className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Order Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHome;
