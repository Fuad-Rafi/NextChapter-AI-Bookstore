import React from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import ShowAll from './pages/showall'
import CreateBook from './pages/createbook'
import EditBooks from './pages/editbooks'
import DeleteBooks from './pages/deletebooks'
import Individual from './pages/Individual'
import Login from './pages/login'
import Signup from './pages/signup'
import CustomerHome from './pages/customerhome'
import OrderBook from './pages/orderbook'
import OrderHistory from './pages/orderhistory'
import { RequireAuth, RequireRole } from './components/ProtectedRoute'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<RequireAuth />}>
        <Route path="/books/:id" element={<Individual />} />

        <Route element={<RequireRole role="customer" />}>
          <Route path="/customer/home" element={<CustomerHome />} />
          <Route path="/customer/order/:id" element={<OrderBook />} />
        </Route>

        <Route element={<RequireRole role="admin" />}>
          <Route path="/admin/home" element={<Home />} />
          <Route path="/admin/orders" element={<OrderHistory />} />
          <Route path="/books" element={<ShowAll />} />
          <Route path="/books/edit/:id" element={<EditBooks />} />
          <Route path="/books/delete/:id" element={<DeleteBooks />} />
          <Route path="/books/create" element={<CreateBook />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App