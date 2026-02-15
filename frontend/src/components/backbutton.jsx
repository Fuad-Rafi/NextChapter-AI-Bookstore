import React from 'react'
import { Link } from 'react-router-dom';
import { BsArrowBarLeft } from 'react-icons/bs';

const BackButton = ( { to = "/" } ) => {
  return (
    <div className="flex items-center gap-2">
      <Link to={to} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
        <BsArrowBarLeft className="text-xl" />
        <span>Back to Home</span>
      </Link>
    </div>
  )
}

export default BackButton