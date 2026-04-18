"use client";

import { useEffect, useState } from 'react';
import axios from '../../../utils/axios';
import Link from 'next/link';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteOrder = async (orderId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this order?');
    if (!shouldDelete) return;

    try {
      await axios.delete(`/orders/${orderId}`);
      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(error.response?.data?.message || 'Failed to delete order');
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/orders');
        setOrders(response.data.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800 relative">
      <div className="max-w-7xl mx-auto glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[200px] bg-linear-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-gray-200/50 pb-6">
            <h1 className="text-3xl font-serif text-gray-800">Order Management</h1>
            <Link href="/admin/home" className="mt-4 md:mt-0 px-5 py-2 inline-block rounded-xl bg-white/60 border border-white text-sm font-semibold text-gray-700 hover:text-[#D34B4B] hover:bg-white transition shadow-sm">
              &larr; Admin Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D34B4B]"></div>
               <span className="ml-3 text-gray-500 font-medium">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white/40 border border-white/60 p-12 text-center rounded-2xl shadow-sm text-gray-500 font-medium">
              No customer orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/60 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-white/60 text-left">
                    <th className="px-6 py-4">Ordered At</th>
                    <th className="px-6 py-4">Book</th>
                    <th className="px-6 py-4">Author</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-white/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                         <span className="font-semibold text-gray-800 line-clamp-1">{order.bookTitle}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[150px]">{order.bookAuthor}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{order.customerName}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">{order.customerAddress}</td>
                      <td className="px-6 py-4 text-sm tracking-wide text-gray-600 whitespace-nowrap">{order.customerPhone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold text-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
