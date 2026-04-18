"use client";

import Link from 'next/link';
import { FiArrowLeft, FiHeart, FiBookOpen, FiUsers, FiTarget, FiStar } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-100">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-16">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors mb-8 w-fit"
          >
            <FiArrowLeft />
            <span className="text-sm font-medium">Back Home</span>
          </Link>

          <div className="mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-linear-to-r from-[#D34B4B]/10 to-[#FF6B6B]/10 border border-[#D34B4B]/30 mb-4">
              <span className="text-sm font-semibold text-[#D34B4B] dark:text-[#FF6B6B]">About Us</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to <span className="text-transparent bg-clip-text bg-linear-to-r from-[#D34B4B] to-[#FF6B6B]">NextChapter AI</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
              Revolutionizing how readers discover their next favorite book through AI-powered recommendations and intelligent curation.
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <section className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="glass-panel rounded-2xl p-8">
            <div className="w-14 h-14 bg-linear-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <FiTarget className="text-2xl text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We believe everyone deserves to discover books they'll love. NextChapter AI uses advanced machine learning and natural language processing to understand your reading preferences and connect you with books you'll truly enjoy.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <div className="w-14 h-14 bg-linear-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <FiHeart className="text-2xl text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To create a thriving community of readers where AI technology enhances human judgment, making book discovery personal, intuitive, and joyful. We want to help every reader find their next great adventure.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Why Choose NextChapter?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FiBookOpen,
                title: 'Smart Recommendations',
                description: 'Our AI analyzes reading patterns, preferences, and genres to suggest books you\'ll absolutely love.',
                gradient: 'from-cyan-400 to-blue-500',
              },
              {
                icon: FiUsers,
                title: 'Community Driven',
                description: 'Connect with other readers, share recommendations, and discover hidden gems recommended by people like you.',
                gradient: 'from-amber-400 to-orange-500',
              },
              {
                icon: FiStar,
                title: 'Personalized Experience',
                description: 'Your reading history, ratings, and feedback shape your unique recommendation engine that gets smarter over time.',
                gradient: 'from-purple-400 to-pink-500',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group glass-panel rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2"
                >
                  <div
                    className={`w-16 h-16 bg-linear-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="text-3xl text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-20">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: 'Books Available', value: '15,000+' },
              { label: 'Active Readers', value: '50K+' },
              { label: 'Recommendations Daily', value: '10K+' },
              { label: 'Rating (Avg)', value: '4.8★' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="glass-panel rounded-2xl p-8 text-center hover:shadow-lg transition-all"
              >
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <div className="bg-linear-to-r from-[#D34B4B]/10 via-purple-400/10 to-cyan-400/10 dark:from-[#D34B4B]/20 dark:via-purple-500/20 dark:to-cyan-500/20 border border-white/40 dark:border-gray-700 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Discover Your Next Great Read?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join our community of passionate readers and let our Smart Assistant guide you to your next favorite book.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/assistant"
                className="px-8 py-3 rounded-full bg-linear-to-r from-[#D34B4B] to-[#FF6B6B] text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                Try Smart Assistant
              </Link>
              <Link
                href="/"
                className="px-8 py-3 rounded-full bg-white/50 dark:bg-gray-800/50 border border-white/40 dark:border-gray-600 text-gray-900 dark:text-white font-semibold hover:bg-white dark:hover:bg-gray-700 transition-all"
              >
                Browse Books
              </Link>
            </div>
          </div>
        </section>

        {/* Footer Text */}
        <section className="text-center py-12 border-t border-white/20 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            NextChapter AI © 2024. Crafted with <FiHeart className="inline text-[#D34B4B]" /> for book lovers everywhere.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Powered by advanced AI and a passion for storytelling
          </p>
        </section>
      </main>
    </div>
  );
}
