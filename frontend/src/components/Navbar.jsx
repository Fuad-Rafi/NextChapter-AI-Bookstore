"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut } from 'react-icons/fi';
import '../toggle-switch.css';

function NavLink({ href, currentPath, children }) {
  const isActive = currentPath === href;

  return (
    <Link
      href={href}
      className={`transition-colors font-medium border-b-2 ${isActive ? 'border-[#D34B4B] text-[#D34B4B] dark:text-[#E86A6A]' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-[#D34B4B] dark:hover:text-[#E86A6A]'}`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const { isDarkMode, toggleDarkMode, mounted } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  

  // Custom toggle switch for dark mode
  const darkModeSwitch = (
    <div className="flex items-center gap-2">
      <div className="toggle-container" style={{ minWidth: 60, height: 32 }}>
        <input
          type="checkbox"
          id="darkmode-toggle"
          checked={!!isDarkMode}
          onChange={toggleDarkMode}
          disabled={!mounted}
          aria-checked={!!isDarkMode}
          aria-label="Toggle dark mode"
        />
        <label htmlFor="darkmode-toggle" className="toggle-button" style={{ width: 56, height: 28 }}>
          <span className="texture"></span>
          <span className="glow"></span>
        </label>
      </div>
      <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200 select-none">Dark Mode</span>
    </div>
  );

  // Hide extensive navbar on auth pages
  if (pathname === '/login' || pathname === '/signup') {
    return (
      <nav className="glass-nav px-6 py-4 flex items-center justify-between dark:bg-gray-900/70 border-b dark:border-white/10">
        <div className="flex items-center gap-2">
           <div className="flex space-x-1">
             <div className="w-2.5 h-5 bg-red-500 rounded-t-sm"></div>
             <div className="w-2.5 h-6 bg-orange-400 rounded-t-sm"></div>
             <div className="w-2.5 h-4 bg-yellow-500 rounded-t-sm"></div>
           </div>
           <Link href="/" className="text-lg font-black tracking-tight text-gray-800 dark:text-white leading-none">
             NextChapter<br/>AI
           </Link>
        </div>
          {darkModeSwitch}
      </nav>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <nav className="glass-nav px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 dark:bg-gray-900/80 border-b dark:border-white/10">
      <div className="flex items-center gap-8 lg:gap-12 w-full md:w-auto overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        <Link href={role === 'admin' ? '/admin/home' : '/'} className="flex items-center gap-2 flex-shrink-0">
          <div className="flex space-x-1">
            <div className="w-3 h-6 bg-red-500 rounded-t-md shadow-sm"></div>
            <div className="w-3 h-8 bg-orange-400 rounded-t-md shadow-sm"></div>
            <div className="w-3 h-5 bg-yellow-500 rounded-t-md shadow-sm"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-800 dark:text-white leading-none">
            NextChapter<br/>AI
          </span>
        </Link>
        
        <div className="flex items-center gap-6 text-sm whitespace-nowrap">
          {role === 'admin' ? (
            <>
              <NavLink href="/admin/home" currentPath={pathname}>Home</NavLink>
              <NavLink href="/admin/orders" currentPath={pathname}>Order Dashboard</NavLink>
              <NavLink href="/books/create" currentPath={pathname}>Add Book</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/" currentPath={pathname}>Home</NavLink>
              <NavLink href="/assistant" currentPath={pathname}>Smart Assistant</NavLink>
              <NavLink href="/my-orders" currentPath={pathname}>My Orders</NavLink>
              <NavLink href="/about" currentPath={pathname}>About Us</NavLink>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {darkModeSwitch}

        {user ? (
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 shadow-sm border border-gray-200/50 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors text-gray-600 dark:text-gray-300 font-semibold text-sm"
          >
            <FiLogOut />
            Logout
          </button>
        ) : (
          <div className="flex gap-3">
             <Link href="/login" className="px-5 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 shadow-sm border border-gray-200/50 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-semibold text-sm">
               Login
             </Link>
             <Link href="/signup" className="px-5 py-2 rounded-xl bg-[#D34B4B] shadow-sm hover:bg-red-700 transition-colors text-white font-semibold text-sm">
               Sign Up
             </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
