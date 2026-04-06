import express from 'express';
import Book from '../models/bookmodels.js';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/auth.js';
import { normalizeBookPayload } from '../utils/ragData.js';

const router = express.Router();

const parseOptionalPrice = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 200 || parsed > 700) {
        return undefined;
    }

    return parsed;
};

const parseOptionalRating = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
        return undefined;
    }

    return parsed;
};

const buildBookPayload = (body) => {
    const normalized = normalizeBookPayload(body);
    const parsedPrice = parseOptionalPrice(body.price);
    const parsedRating = parseOptionalRating(body.rating);

    if (parsedPrice === undefined || parsedRating === undefined) {
        return undefined;
    }

    return {
        ...normalized,
        price: parsedPrice,
        rating: parsedRating,
    };
};

// route to get all books
router.get('/', optionalAuthenticateToken, async (req, res) => {
    try {
        const books = await Book.find({});

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
router.get('/:id', optionalAuthenticateToken, async (req, res) => {
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
        const payload = buildBookPayload(req.body);
        if (!payload) {
            return res.status(400).json({ message: 'Invalid price value' });
        }

        if (!payload.title || !payload.author || !payload.publishedDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        });

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
        const payload = buildBookPayload(request.body);

        if (!payload) {
            return response.status(400).json({ message: 'Invalid price value' });
        }

        if (!payload.title || !payload.author || !payload.publishedDate) {
            return response.status(400).json({ message: 'Missing required fields' });
        }

        const newBook = new Book({
            ...payload,
        });

        const savedBook = await newBook.save();
        response.status(201).json(savedBook);
    } catch (error) {
        console.error('Error creating book:', error.message);
        response.status(500).json({ message: error.message });
    }
});

export default router;