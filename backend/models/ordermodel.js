import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: true,
      trim: true,
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true,
    },
    bookAuthor: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerAddress: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
