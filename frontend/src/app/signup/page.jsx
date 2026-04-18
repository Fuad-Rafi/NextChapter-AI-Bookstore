"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/axios';

export default function Signup() {
  const { isAuthenticated, role, setSession } = useAuth();
  const router = useRouter();

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

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(role === 'admin' ? '/admin/home' : '/');
    }
  }, [isAuthenticated, role, router]);

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
      router.replace('/');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative font-sans text-gray-800">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-serif text-gray-800 mb-2">Create Account</h1>
            <p className="text-sm text-gray-500">Join the digital library</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Name</label>
              <input
                type="text"
                {...register('name', { required: 'Name is required.' })}
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required.' })}
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required.',
                  minLength: { value: 6, message: 'Password must be at least 6 characters.' },
                })}
                className="w-full bg-white/50 border border-white/70 text-gray-900 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#D34B4B]/30 transition shadow-sm placeholder:text-gray-400"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-[#D34B4B] to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 mt-4 rounded-xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-600 mt-6 border-t border-gray-200/50 pt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#D34B4B] font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
