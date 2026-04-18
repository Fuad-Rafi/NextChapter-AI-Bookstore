"use client";

import { useEffect, useState } from 'react';
import axios from '../../utils/axios';
import Link from 'next/link';
import { FiArrowLeft, FiPackage, FiCalendar, FiDollarSign } from 'react-icons/fi';
import Spinner from '../../components/spinner';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('/orders');
        setOrders(response.data.orders || response.data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Unable to load your orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-100">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors mb-6 w-fit"
          >
            <FiArrowLeft />
            <span className="text-sm font-medium">Back Home</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-linear-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-lg">
              <FiPackage className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Orders</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage your book orders</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : error ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-full bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white font-semibold hover:shadow-lg transition-all"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <FiPackage className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">No Orders Yet</h2>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Start shopping and your orders will appear here.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 rounded-full bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white font-semibold hover:shadow-lg transition-all"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="group glass-panel rounded-2xl overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="grid md:grid-cols-[1fr_auto] gap-6 p-6">
                  {/* Order Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Order ID</p>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          {order._id?.slice(-8).toUpperCase() || 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status || 'Pending'}
                      </span>
                    </div>

                    {/* Book Info */}
                    {order.bookId && (
                      <div className="border-t border-white/20 dark:border-gray-700 pt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Book Ordered</p>
                        <p className="font-bold text-gray-900 dark:text-white text-lg">
                          {order.bookId?.title || 'Unknown Book'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {order.bookId?.author || 'Unknown Author'}
                        </p>
                      </div>
                    )}

                    {/* Delivery Address */}
                    {order.address && (
                      <div className="border-t border-white/20 dark:border-gray-700 pt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delivery Address</p>
                        <p className="text-sm text-gray-900 dark:text-white">{order.address}</p>
                      </div>
                    )}

                    {/* Customer Info */}
                    {order.userId && (
                      <div className="border-t border-white/20 dark:border-gray-700 pt-4 grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order.userId?.username || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {order.userId?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Summary */}
                  <div className="space-y-4 md:border-l border-white/20 dark:border-gray-700 md:pl-6">
                    {/* Price */}
                    {order.totalPrice && (
                      <div className="bg-linear-to-br from-amber-50 dark:from-amber-900/30 to-orange-50 dark:to-orange-900/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <FiDollarSign size={16} />
                          <span className="text-sm">Total Price</span>
                        </div>
                        <p className="text-3xl font-bold text-[#D34B4B] dark:text-[#FF6B6B]">
                          Tk {order.totalPrice}
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="bg-linear-to-br from-blue-50 dark:from-blue-900/30 to-cyan-50 dark:to-cyan-900/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <FiCalendar size={16} />
                        <span className="text-sm">Order Date</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    {/* Action Button */}
                    {order.bookId?._id && (
                      <Link
                        href={`/books/${order.bookId._id}`}
                        className="block w-full text-center px-4 py-2 rounded-lg bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
                      >
                        View Book
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
