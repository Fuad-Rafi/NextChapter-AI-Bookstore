# MERN Book Platform with RAG Assistant

Last updated: 2026-04-07

A full-stack MERN application for book catalog browsing, ordering, and AI-assisted recommendations.

The platform includes:
- Role-based auth (admin and customer flows)
- Book management and order management
- Retrieval-Augmented Generation (RAG) recommendation assistant
- Persistent conversational memory and feedback-driven ranking
- Hybrid semantic retrieval: Qdrant vector search with Mongo fallback

## Table of Contents
- Overview
- What Is Implemented
- RAG Architecture
- Recommendation Engine
- Data Model
- Tech Stack and Tools
- Repository Structure
- Local Development Setup
- Environment Variables
- Scripts
- API Summary
- Deployment (Vercel)
- Testing
- Troubleshooting
- Roadmap

## Overview
This project combines a traditional e-commerce-style book app with an assistant that understands natural language requests like:
- "I like Stephen King"
- "fast-paced mystery under Tk 400"
- "show me more like the second one"

The assistant extracts preferences, merges them with saved memory, retrieves candidate books semantically, ranks them using a weighted scoring model, and returns chat responses plus recommendation cards.

## What Is Implemented

### Core Application
- Customer signup/login using JWT
- Admin login and role-based protected routes
- Book CRUD (admin)
- Customer ordering flow
- Catalog and detail views

### Assistant + RAG
- Chat endpoint with rate limiting
- Preference extraction from natural language
- Conversation memory persistence in MongoDB
- Feedback endpoint (like/dislike/click/view)
- Semantic relevance using embeddings (Xenova all-MiniLM-L6-v2)
- Qdrant vector retrieval (optional, enabled by flag)
- Automatic fallback to Mongo cosine search if Qdrant is unavailable
- Ranked recommendation output returned directly to UI

### Recent Enhancements
- Fixed empty recommendation regression by removing fragile title-matching dependency
- Added author preference extraction and author-aware ranking boost
- Added memory snapshot fields for preferred authors
- Added catalog fallback cache in frontend when live API fetch fails
- Added safety logging and configurable request limits
- Added Qdrant integration service (`qdrantService`) with collection auto-create
- Added vector sync tooling (`npm run qdrant:sync`) and embedding/CRUD sync hooks
- Reduced built-in history dominance in ranking defaults (`historyMatch` fallback set to `0.8`)

## RAG Architecture

### High-Level Flow
1. User sends a message in the assistant panel.
2. Backend validates auth and input.
3. System extracts signals from message:
- Preferred genres
- Disliked genres
- Preferred authors
- Budget min/max
- Pace and length preferences
4. System merges memory in priority order:
- Current message
- Current conversation profile
- Saved user preferences
5. Recommendation query text is assembled from message + memory.
6. Query embedding is generated with Xenova all-MiniLM-L6-v2.
7. Candidate books are retrieved via vector search and scored using lexical + semantic + behavior signals.
8. Top ranked books are returned to chat response.
9. Conversation + memory + feedback state are saved for continuity.

### Components Used in RAG
- `backend/services/memoryService.js`
- `backend/services/embeddingService.js`
- `backend/services/qdrantService.js`
- `backend/services/recommendationService.js`
- `backend/services/vectorSearchService.js`
- `backend/utils/recommendationScoring.js`
- `backend/routes/assistantchat.js`

### Why This Is RAG
The assistant is grounded in your catalog data and historical interaction signals. It does not generate arbitrary recommendations from outside context. It retrieves and ranks known books, then generates response text from those candidates.

### Retrieval Modes
- `QDRANT_ENABLED=1`: query vectors are searched in Qdrant first, then hydrated from Mongo for ranking and response output.
- `QDRANT_ENABLED=0` (or runtime retrieval failure): search falls back to Mongo cosine similarity path.

## Recommendation Engine

### Scoring Inputs
- Query token overlap
- Semantic similarity (query embedding vs book embedding)
- User preference match
- Purchase history similarity
- Feedback profile match
- Book popularity prior (rating)
- Diversity boost
- Penalties for dislikes/disliked feedback
- Explicit author preference boost

### Behavior Notes
- Budget max is also hard-filtered in chat response stage.
- Ordered books are excluded from recommendation candidates where applicable.
- If embedding generation fails, scoring gracefully falls back to token-based relevance.
- Default history weight fallback in code is intentionally lowered (`historyMatch = 0.8`) to reduce over-personalization from old behavior.

## Data Model

### Collections
- `users`
- `books`
- `orders`
- `chatmemories`

### Important Fields

User
- `preferences.preferredGenres`
- `preferences.dislikedGenres`
- `preferences.preferredAuthors`
- `preferences.budgetRange`
- `feedbackProfile` (liked/disliked/clicked/viewed book ids)
- `assistantMemory` (summary and timestamps)

Book
- Metadata fields (`title`, `author`, `genre`, `tags`, `themes`, `subjects`, `price`, `rating`)
- `embedding` (384-dim vector)
- `semanticMetadata` (embeddedAt, modelVersion)

ChatMemory
- `messages[]` with per-turn extracted preferences
- `memoryProfile`
- `summary`
- `lastMessageAt`

## Tech Stack and Tools

### Backend
- Node.js
- Express 5
- MongoDB + Mongoose
- JSON Web Token (`jsonwebtoken`)
- `bcryptjs`
- CORS
- `nodemon`

### AI / RAG
- `@xenova/transformers`
- Model: `Xenova/all-MiniLM-L6-v2`
- Qdrant (`@qdrant/js-client-rest`) for vector retrieval
- Local embedding generation + optional vector DB storage
- Optional Groq response generation (with fallback behavior when key unavailable)

### Frontend
- React 19
- Vite 7
- React Router 7
- Axios
- Zustand
- React Hook Form
- Tailwind CSS 4
- React Icons

### Testing / Quality
- Node built-in test runner (`node --test`)
- `mongodb-memory-server`
- `supertest`
- ESLint

## Repository Structure

```text
backend/
  config.js
  index.js
  middleware/
    auth.js
    rateLimit.js
  models/
    bookmodels.js
    chatmemorymodel.js
    ordermodel.js
    usermodel.js
  routes/
    assistantchat.js
    authroutes.js
    bookrecommendations.js
    bookrouts.js
    orderroutes.js
  scripts/
    backfillPhase1.mjs
    embedBooks.mjs
    seedPhase2Books.mjs
    seedPhase3Books.mjs
    syncQdrant.mjs
  services/
    embeddingService.js
    llmService.js
    memoryService.js
    qdrantService.js
    recommendationService.js
    vectorSearchService.js
  test/
    phase4.test.mjs
    phase5.test.mjs
    phase7.test.mjs
    phase8.test.mjs
  utils/
    ragData.js
    recommendationScoring.js
    securityLogger.js

frontend/
  api/
    [...path].js
  src/
    components/
    context/
    hooks/
    pages/
    store/
    utils/
```

## Local Development Setup

### Prerequisites
- Node.js 18+ (recommended)
- npm
- MongoDB local instance (default URI used in `.env`)
- Optional: local Qdrant at `http://localhost:6333`

### 1) Install dependencies

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

### 2) Configure environment
Create `backend/.env` and set required values.

### 3) Seed data
```bash
cd backend
npm run seed:phase2
```

Optional extended catalog:
```bash
npm run seed:phase3
```

### 4) (Optional) generate embeddings
```bash
npm run embed:books
```

### 5) (Optional) sync vectors to Qdrant
```bash
npm run qdrant:sync
```

### 6) Run services

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

Default local URLs:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173` (or next free Vite port)

## Environment Variables

Example backend `.env` keys:

```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017/blog
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=change-this
JWT_EXPIRES_IN=7d

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

REQUIRE_GROQ_API_KEY=0
GROQ_API_KEY=

RATE_LIMIT_AUTH_LOGIN_PER_MINUTE=20
RATE_LIMIT_ASSISTANT_CHAT_PER_MINUTE=20
RATE_LIMIT_ASSISTANT_FEEDBACK_PER_MINUTE=40

# Optional recommendation tuning
REC_HISTORY_WEIGHT=0.8

# Optional Qdrant vector retrieval
QDRANT_ENABLED=0
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=books
QDRANT_SEARCH_LIMIT=40
```

Notes:
- Keep `REQUIRE_GROQ_API_KEY=0` if you want local fallback reply behavior without provider dependency.
- For local Docker Qdrant, set `QDRANT_URL=http://localhost:6333` and keep `QDRANT_API_KEY=` empty.
- Never commit secrets to public repositories.

## Scripts

### Backend scripts
```bash
npm run dev
npm run start
npm run test
npm run seed:phase2
npm run seed:phase3
npm run embed:books
npm run qdrant:sync
npm run backfill:phase1
```

### Frontend scripts
```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## API Summary

### Auth
- `POST /auth/signup`
- `POST /auth/login`

### Books
- `GET /books`
- `GET /books/:id`
- `POST /books` (admin)
- `PUT /books/:id` (admin)
- `DELETE /books/:id` (admin)

### Orders
- `POST /orders` (customer)
- `GET /orders` (admin)

### Assistant / Recommendations
- `GET /books/recommendations` (customer)
- `POST /assistant/chat` (customer)
- `POST /assistant/feedback` (customer)

## Deployment (Vercel)

Use separate Vercel projects for backend and frontend.

### Backend
- Root directory: `backend`
- Uses `backend/vercel.json`
- Set env vars (Mongo, JWT, rate limits, optional Groq key, optional Qdrant settings)

### Frontend
- Root directory: `frontend`
- Uses rewrite/proxy setup + `frontend/api/[...path].js`
- Set `BACKEND_URL` to deployed backend URL

Health probe via frontend proxy:
- `GET /api/health`

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Current test focus includes:
- Chat memory continuity
- Feedback-to-ranking behavior
- Endpoint authorization
- Rate limiting behavior
- Security logger redaction

## Troubleshooting

### Products page shows empty list
- Ensure backend is running.
- Ensure MongoDB is running.
- Reseed catalog:
```bash
cd backend
npm run seed:phase2
```

### Assistant returns weak or generic results
- Confirm books exist in database.
- Run embedding generation if semantic layer is missing:
```bash
npm run embed:books
```
- If Qdrant is enabled, sync vectors:
```bash
npm run qdrant:sync
```

### Qdrant shows disabled during sync
- Ensure `QDRANT_ENABLED=1` and `QDRANT_URL` are set in backend `.env`.
- For local Docker Qdrant use `QDRANT_URL=http://localhost:6333`.
- Keep `QDRANT_API_KEY=` empty for local HTTP setup.

### Author preference not reflected
- Use prompts like: "I like Stephen King" or "books by Stephen King".
- Ensure backend restarted after config or schema changes.

### Frontend starts on another port
Vite auto-picks next free port (for example 5174). This is expected.

## Roadmap
- Improve typo tolerance and fuzzy author matching
- Add richer preference extraction (language, series, publication period)
- Add observability dashboard for ranking breakdowns
- Add token revocation and stronger session controls
- Expand seed catalog and metadata richness

---
If you want, the next step can be a companion `ARCHITECTURE.md` with sequence diagrams and per-file responsibilities for onboarding new developers quickly.
