import express from 'express';
import mongoose from 'mongoose';
import Book from '../models/bookmodels.js';
import Order from '../models/ordermodel.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// route to get all books
router.get('/', async (req, res) => {
    try {
        const orderedBookIds = await Order.distinct('bookId');
        const orderedObjectIds = orderedBookIds
            .filter((bookId) => mongoose.Types.ObjectId.isValid(bookId))
            .map((bookId) => new mongoose.Types.ObjectId(bookId));

        const books = await Book.find({
            _id: { $nin: orderedObjectIds }
        });

        res.json({
            count: books.length,
            books
        });
    } catch (error) {
        console.error('Error fetching books:', error.message);
        res.status(500).json({ message: error.message });
    }
});
// route to get one book by ID
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        console.error('Error fetching book:', error.message);
        res.status(500).json({ message: error.message });
    }
});

//route to update a new book (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json(updatedBook);
    } catch (error) {
        console.error('Error updating book:', error.message);
        res.status(500).json({ message: error.message });
    }
});

//route to delete a book by ID (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(req.params.id);

        if (!deletedBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error deleting book:', error.message);
        res.status(500).json({ message: error.message });
    }
});

//route to create a new book (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (request, response) => {
    try {
        const publishedDate = request.body.publishedDate ?? request.body.publishYear;

        if (!request.body.title || !request.body.author || !publishedDate) {
            return response.status(400).json({ message: 'Missing required fields' });
        }

        const newBook = new Book({
            title: request.body.title,
            author: request.body.author,
            publishedDate,
        });

        const savedBook = await newBook.save();
        response.status(201).json(savedBook);
    } catch (error) {
        console.error('Error creating book:', error.message);
        response.status(500).json({ message: error.message });
    }
});

export default router;