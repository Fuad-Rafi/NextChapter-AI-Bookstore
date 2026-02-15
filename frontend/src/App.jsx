import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import ShowAll from './pages/showall'
import CreateBook from './pages/createbook'
import EditBooks from './pages/editbooks'
import DeleteBooks from './pages/deletebooks'
import Individual from './pages/Individual'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books" element={<ShowAll />} />
      <Route path="/books/:id" element={<Individual />} />
      <Route path="/books/edit/:id" element={<EditBooks />} />
      <Route path="/books/delete/:id" element={<DeleteBooks />} />
      <Route path="/books/create" element={<CreateBook />} />
    </Routes>
  )
}

export default App