import { useState } from 'react';
import axios from 'axios';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API_BASE = 'http://localhost:5000';

const Login = () => {
  const { isAuthenticated, role, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('customer');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/home' : '/customer/home'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'customer' && (!email.trim() || !password.trim())) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'admin' && (!username.trim() || !password.trim())) {
      setError('Username and password are required for admin login.');
      return;
    }

    try {
      setLoading(true);
      const body =
        mode === 'admin'
          ? { role: 'admin', username: username.trim(), password }
          : { email: email.trim(), password };

      const response = await axios.post(`${API_BASE}/auth/login`, body);
      setSession(response.data);

      const redirectedPath = location.state?.from?.pathname;
      if (response.data.role === 'admin') {
        navigate(redirectedPath && redirectedPath !== '/login' ? redirectedPath : '/admin/home', {
          replace: true,
        });
      } else {
        navigate('/customer/home', { replace: true });
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Login</h1>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('customer')}
            className={`px-4! py-2! rounded ${
              mode === 'customer' ? 'bg-blue-600! text-white!' : 'bg-gray-200! text-slate-800!'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setMode('admin')}
            className={`px-4! py-2! rounded ${
              mode === 'admin' ? 'bg-blue-600! text-white!' : 'bg-gray-200! text-slate-800!'
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'customer' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
                placeholder="you@example.com"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
                placeholder="admin"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
              placeholder="********"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600! hover:bg-blue-700! text-white! py-2! rounded disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          New customer?{' '}
          <Link to="/signup" className="text-blue-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
