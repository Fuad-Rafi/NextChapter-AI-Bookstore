import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';

const OrderBook = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
    },
  });

  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setValue('name', user.name);
    }
  }, [setValue, user]);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoadingBook(true);
        const response = await axios.get(`/books/${id}`);
        setBook(response.data);
      } catch (fetchError) {
        console.error('Error fetching selected book:', fetchError);
      } finally {
        setLoadingBook(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleConfirm = async (values) => {
    setError('');

    if (!values.name.trim() || !values.address.trim() || !values.phone.trim()) {
      setError('Name, address and phone number are required.');
      return;
    }

    if (!book?._id || !book?.title || !book?.author) {
      setError('Selected book data is not available.');
      return;
    }

    try {
      setSubmitting(true);

      await axios.post('/orders', {
        bookId: book._id,
        bookTitle: book.title,
        bookAuthor: book.author,
        customerName: values.name.trim(),
        customerAddress: values.address.trim(),
        customerPhone: values.phone.trim(),
      });

      setSubmittedOrder({
        name: values.name.trim(),
        address: values.address.trim(),
        phone: values.phone.trim(),
      });
      setConfirmed(true);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to save order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <Link to="/customer/home" className="text-blue-600 hover:underline">
            Back to Customer Home
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-4">Order Book</h1>

        {loadingBook ? (
          <p className="text-slate-600">Loading selected book...</p>
        ) : (
          <p className="text-slate-700 mb-6">
            Selected book: <span className="font-semibold">{book?.title || 'Unknown Book'}</span>
          </p>
        )}

        <form onSubmit={handleSubmit(handleConfirm)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              {...register('name', { required: 'Name is required.' })}
              className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
              placeholder="Your full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              {...register('address', { required: 'Address is required.' })}
              className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
              placeholder="Your delivery address"
              rows={3}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              {...register('phone', { required: 'Phone number is required.' })}
              className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
              placeholder="Your phone number"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Saving Order...' : 'Confirm Order'}
          </button>
        </form>

        {confirmed && (
          <div className="mt-6 border border-green-300 bg-green-50 rounded p-4">
            <h2 className="font-semibold text-green-800">Order Confirmed</h2>
            <p className="text-green-700 text-sm mt-2">Name: {submittedOrder?.name || user?.name || 'Customer'}</p>
            <p className="text-green-700 text-sm">Address: {submittedOrder?.address || 'confirmed'}</p>
            <p className="text-green-700 text-sm">Phone: {submittedOrder?.phone || 'confirmed'}</p>
            <p className="text-green-700 text-sm">Book: {book?.title || 'Unknown Book'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderBook;
