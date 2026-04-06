import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/axios';

const Signup = () => {
  const { isAuthenticated, role, setSession } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/home' : '/customer/home'} replace />;
  }

  const onSubmit = async (values) => {
    setError('');

    if (!values.name.trim() || !values.email.trim() || !values.password.trim()) {
      setError('Name, email and password are required.');
      return;
    }

    if (values.password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/signup', {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      setSession(response.data);
      reset();
      navigate('/customer/home', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Customer Sign Up</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              {...register('name', { required: 'Name is required.' })}
              className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
              placeholder="Your name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required.' })}
              className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required.',
                minLength: { value: 6, message: 'Password must be at least 6 characters.' },
              })}
              className="w-full border border-slate-300 text-slate-900 bg-white rounded p-2"
              placeholder="At least 6 characters"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600! hover:bg-blue-700! text-white! py-2! rounded disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
