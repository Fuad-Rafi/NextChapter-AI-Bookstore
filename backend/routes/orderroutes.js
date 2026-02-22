import express from 'express';
import Order from '../models/ordermodel.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.post('/', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const {
      bookId,
      bookTitle,
      bookAuthor,
      customerName,
      customerAddress,
      customerPhone,
    } = req.body;

    if (
      !bookId ||
      !bookTitle ||
      !bookAuthor ||
      !customerName ||
      !customerAddress ||
      !customerPhone
    ) {
      return res.status(400).json({ message: 'Missing required order fields' });
    }

    const normalizedBookId = String(bookId).trim();
    const existingOrder = await Order.findOne({ bookId: normalizedBookId });

    if (existingOrder) {
      return res.status(409).json({ message: 'This book is already ordered' });
    }

    const newOrder = await Order.create({
      bookId: normalizedBookId,
      bookTitle: String(bookTitle).trim(),
      bookAuthor: String(bookAuthor).trim(),
      customerName: String(customerName).trim(),
      customerAddress: String(customerAddress).trim(),
      customerPhone: String(customerPhone).trim(),
    });

    return res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error.message);
    return res.status(500).json({ message: 'Failed to create order' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error.message);
    return res.status(500).json({ message: 'Failed to delete order' });
  }
});

export default router;
