import React from 'react'
import Link from 'next/link';
import { BsArrowBarLeft } from 'react-icons/bs';

const BackButton = ( { to = "/" } ) => {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Link href={to} className="flex items-center gap-2 text-gray-600 hover:text-[#D34B4B] transition-colors font-medium">
        <BsArrowBarLeft className="text-xl" />
        <span>Back</span>
      </Link>
    </div>
  )
}

export default BackButton