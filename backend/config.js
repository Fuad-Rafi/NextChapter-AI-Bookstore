import 'dotenv/config';

export const PORT = process.env.PORT || 5000;

export const mongoDBURL = process.env.MONGODB_URL || 'mongodb://localhost:27017/blog';

export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';