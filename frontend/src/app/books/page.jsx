"use client";

import React from 'react'
import BackButton from '../../components/backbutton'

export default function ShowAll() {
  return (
    <div className="min-h-screen p-4 md:p-8 font-sans text-gray-800 relative">
      <div className="max-w-4xl mx-auto glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>
        <div className="relative z-10 flex flex-col items-center justify-center py-20 text-center">
            
          <h1 className="text-4xl font-serif text-gray-800 mb-4">Show All Books</h1>
          <p className="text-gray-500 mb-8 border-b border-gray-200/50 pb-8 px-10">
            This module is reserved for bulk visualization and operations.<br/>
            Functionality coming soon...
          </p>
          <BackButton to="/admin/home" />
        </div>
      </div>
    </div>
  )
}
