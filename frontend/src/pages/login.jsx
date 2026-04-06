import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/axios';

const Login = () => {
  const { isAuthenticated, role, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  const [mode, setMode] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/home' : '/customer/home'} replace />;
  }

  const onSubmit = async (values) => {
    setError('');

    if (mode === 'customer' && (!values.email?.trim() || !values.password?.trim())) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'admin' && (!values.username?.trim() || !values.password?.trim())) {
      setError('Username and password are required for admin login.');
      return;
    }

    try {
      setLoading(true);
      const body =
        mode === 'admin'
          ? { role: 'admin', username: values.username.trim(), password: values.password }
          : { email: values.email.trim(), password: values.password };

      const response = await api.post('/auth/login', body);
      setSession(response.data);
      reset();

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mode === 'customer' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email', {
                  required: mode === 'customer' ? 'Email is required.' : false,
                })}
                className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin Username</label>
              <input
                type="text"
                {...register('username', {
                  required: mode === 'admin' ? 'Username is required.' : false,
                })}
                className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
                placeholder="admin"
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required.' })}
              className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
              placeholder="********"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
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
