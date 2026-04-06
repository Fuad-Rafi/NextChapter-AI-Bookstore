const TOKEN_PATTERN = /Bearer\s+[A-Za-z0-9\-_.=]+/gi;
const SECRET_KEYS = [
  'JWT_SECRET',
  'ADMIN_PASSWORD',
  'GROQ_API_KEY',
  'MONGODB_URL',
];

const toSafeString = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const redactSensitive = (input) => {
  let text = toSafeString(input);

  for (const key of SECRET_KEYS) {
    const secret = process.env[key];
    if (!secret) {
      continue;
    }

    text = text.split(secret).join('[REDACTED]');
  }

  text = text.replace(TOKEN_PATTERN, 'Bearer [REDACTED]');
  text = text.replace(/("password"\s*:\s*")[^"]+("?)/gi, '$1[REDACTED]$2');

  return text;
};

export const safeLogError = (label, error, metadata = {}) => {
  const safeLabel = redactSensitive(label);
  const safeErrorMessage = redactSensitive(error?.message || String(error));
  const safeMetadata = redactSensitive(metadata);

  console.error(`${safeLabel}: ${safeErrorMessage}`);
  if (safeMetadata && safeMetadata !== '{}') {
    console.error(`metadata=${safeMetadata}`);
  }
};
