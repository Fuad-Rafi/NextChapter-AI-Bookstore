import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { safeLogError } from '../utils/securityLogger.js';

/**
 * Middleware to verify JWT token from Authorization header
 * Attaches decoded user info to req.user if valid
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(403).json({ message: 'Invalid token' });
      }

      req.user = decoded; // Attach user info (id, role, email/username)
      next();
    });
  } catch (error) {
    safeLogError('Authentication middleware error', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

/**
 * Middleware to attach req.user when a valid token exists.
 * Unlike authenticateToken, this never blocks the request.
 */
export const optionalAuthenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        req.user = decoded;
      }

      next();
    });
  } catch (error) {
    next();
  }
};

/**
 * Middleware to require specific role(s)
 * Must be used AFTER authenticateToken
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};
