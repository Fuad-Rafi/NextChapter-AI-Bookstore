"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/axios';

export default function Login() {
  const { isAuthenticated, role, setSession } = useAuth();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { email: '', username: '', password: '' },
  });

  const [mode, setMode] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(role === 'admin' ? '/admin/home' : '/');
    }
  }, [isAuthenticated, role, router]);

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

      if (response.data.role === 'admin') {
        router.replace('/admin/home');
      } else {
        router.replace('/');
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null; // Avoid rendering login briefly while redirecting

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative font-sans text-gray-800">
      {/* Decorative blobs handled by global layout; just add glass panel */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative overflow-hidden">
        {/* Subtle top glare */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-serif text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </div>

          <div className="flex bg-white/40 p-1 rounded-xl mb-6 shadow-inner border border-white/50">
            <button
              type="button"
              onClick={() => setMode('customer')}
              className={`flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${
                mode === 'customer' ? 'bg-white shadow-sm text-[#D34B4B]' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setMode('admin')}
              className={`flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${
                mode === 'admin' ? 'bg-white shadow-sm text-[#D34B4B]' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'customer' ? (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  {...register('email', { required: mode === 'customer' ? 'Email is required.' : false })}
                  className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Admin Username</label>
                <input
                  type="text"
                  {...register('username', { required: mode === 'admin' ? 'Username is required.' : false })}
                  className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                  placeholder="admin"
                />
                {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required.' })}
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-[#D34B4B] to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 mt-2 rounded-xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-600 mt-6 border-t border-gray-200/50 pt-6">
            New customer?{' '}
            <Link href="/signup" className="text-[#D34B4B] font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
