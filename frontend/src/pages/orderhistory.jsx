import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { Link } from 'react-router-dom';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
          <Link to="/admin/home" className="text-blue-600 hover:underline">
            Back to Admin Home
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-slate-600">No customer orders yet.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-slate-700">
                  <th className="p-3 text-left">Ordered At</th>
                  <th className="p-3 text-left">Book</th>
                  <th className="p-3 text-left">Author</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Address</th>
                  <th className="p-3 text-left">Phone</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-t">
                    <td className="p-3 text-slate-700">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-slate-900">{order.bookTitle}</td>
                    <td className="p-3 text-slate-700">{order.bookAuthor}</td>
                    <td className="p-3 text-slate-700">{order.customerName}</td>
                    <td className="p-3 text-slate-700">{order.customerAddress}</td>
                    <td className="p-3 text-slate-700">{order.customerPhone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
