import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/usermodel.js';
import { normalizeAssistantMemory, normalizeUserPreferences } from '../utils/ragData.js';
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  JWT_EXPIRES_IN,
  JWT_SECRET,
} from '../config.js';

const router = express.Router();

const createToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  preferences: user.preferences,
  assistantMemory: user.assistantMemory,
  profileNotes: user.profileNotes,
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const preferences = normalizeUserPreferences(req.body);
    const assistantMemory = normalizeAssistantMemory(req.body.assistantMemory);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'customer',
      preferences,
      assistantMemory,
      profileNotes: typeof req.body.profileNotes === 'string' ? req.body.profileNotes.trim() : '',
    });

    const token = createToken({ id: user._id, role: user.role, email: user.email });

    return res.status(201).json({
      message: 'Signup successful',
      token,
      role: user.role,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { role, email, password, username } = req.body;

    if (role === 'admin') {
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required for admin login' });
      }

      // Compare username and hash password for security
      const isValidUsername = username === ADMIN_USERNAME;
      if (!isValidUsername) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      // Check if admin password is hashed (starts with $2a$ or $2b$ for bcrypt)
      const isPasswordHashed = ADMIN_PASSWORD.startsWith('$2a$') || ADMIN_PASSWORD.startsWith('$2b$');
      
      let isValidPassword = false;
      if (isPasswordHashed) {
        // Compare hashed password
        isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD);
      } else {
        // Fallback to plaintext comparison (development only - log warning)
        console.warn('WARNING: Admin password is not hashed. Please hash it in .env file.');
        isValidPassword = password === ADMIN_PASSWORD;
      }

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      const token = createToken({ role: 'admin', username });

      return res.status(200).json({
        message: 'Admin login successful',
        token,
        role: 'admin',
        user: {
          username,
        },
      });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken({ id: user._id, role: user.role, email: user.email });

    return res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint (mainly for logging purposes - JWT is stateless)
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // This endpoint exists for logging/audit purposes
  return res.status(200).json({ message: 'Logout successful' });
});

export default router;