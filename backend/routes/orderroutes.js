import express from 'express';
import Order from '../models/ordermodel.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { normalizeOrderPayload } from '../utils/ragData.js';
import { safeLogError } from '../utils/securityLogger.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    safeLogError('Error fetching orders', error);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.get('/my-orders', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const customerOrders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({
      count: customerOrders.length,
      orders: customerOrders,
    });
  } catch (error) {
    safeLogError('Error fetching customer orders', error, { userId: req.user?.id });
    return res.status(500).json({ message: 'Failed to fetch your orders' });
  }
});

router.post('/', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const normalizedOrder = normalizeOrderPayload(req.body, req.user?.id);

    if (
      !normalizedOrder.bookId ||
      !normalizedOrder.bookTitle ||
      !normalizedOrder.bookAuthor ||
      !normalizedOrder.customerName ||
      !normalizedOrder.customerAddress ||
      !normalizedOrder.customerPhone
    ) {
      return res.status(400).json({ message: 'Missing required order fields' });
    }

    const existingOrder = await Order.findOne({
      bookId: normalizedOrder.bookId,
      customerId: normalizedOrder.customerId,
    });

    if (existingOrder) {
      return res.status(409).json({ message: 'This book is already ordered' });
    }

    const newOrder = await Order.create({
      ...normalizedOrder,
    });

    return res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
    });
  } catch (error) {
    safeLogError('Error creating order', error);
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
    safeLogError('Error deleting order', error);
    return res.status(500).json({ message: 'Failed to delete order' });
  }
});

export default router;
