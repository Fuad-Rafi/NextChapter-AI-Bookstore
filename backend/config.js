import 'dotenv/config';

export const PORT = process.env.PORT || 5000;

export const mongoDBURL = process.env.MONGODB_URL || 'mongodb://localhost:27017/blog';

export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export const GROQ_API_KEY = String(process.env.GROQ_API_KEY || '').trim();
export const REQUIRE_GROQ_API_KEY = String(process.env.REQUIRE_GROQ_API_KEY || '').trim().startsWith('1');
export const RATE_LIMIT_ASSISTANT_CHAT_PER_MINUTE = Number(process.env.RATE_LIMIT_ASSISTANT_CHAT_PER_MINUTE || 20);
export const RATE_LIMIT_ASSISTANT_FEEDBACK_PER_MINUTE = Number(process.env.RATE_LIMIT_ASSISTANT_FEEDBACK_PER_MINUTE || 40);
export const RATE_LIMIT_AUTH_LOGIN_PER_MINUTE = Number(process.env.RATE_LIMIT_AUTH_LOGIN_PER_MINUTE || 20);

// Embedding configuration
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
export const REC_SEMANTIC_WEIGHT = Number(process.env.REC_SEMANTIC_WEIGHT || 2.5);

export const validateEnvironment = () => {
	if (!mongoDBURL) {
		throw new Error('MONGODB_URL is required');
	}

	if (!JWT_SECRET || JWT_SECRET === 'change-me-in-env') {
		if (process.env.NODE_ENV === 'production') {
			throw new Error('JWT_SECRET must be configured in production');
		}
	}

	if (REQUIRE_GROQ_API_KEY && !GROQ_API_KEY) {
		throw new Error('GROQ_API_KEY is required when REQUIRE_GROQ_API_KEY=1');
	}

	const numericLimits = [
		['RATE_LIMIT_ASSISTANT_CHAT_PER_MINUTE', RATE_LIMIT_ASSISTANT_CHAT_PER_MINUTE],
		['RATE_LIMIT_ASSISTANT_FEEDBACK_PER_MINUTE', RATE_LIMIT_ASSISTANT_FEEDBACK_PER_MINUTE],
		['RATE_LIMIT_AUTH_LOGIN_PER_MINUTE', RATE_LIMIT_AUTH_LOGIN_PER_MINUTE],
	];

	for (const [name, value] of numericLimits) {
		if (!Number.isFinite(value) || value <= 0) {
			throw new Error(`${name} must be a positive number`);
		}
	}
};