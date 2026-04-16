# MERN Book Platform with Classic RAG Assistant

Last updated: 2026-04-16

A full-stack MERN application for book catalog browsing, ordering, and AI-assisted retrieval.

This version uses a classic RAG architecture:
- Intent routing before retrieval
- Semantic retrieval over current query only
- Grounded generation from retrieved catalog books
- Qdrant-first retrieval with Mongo fallback

## Table of Contents
- Overview
- What Is Implemented
- Current RAG Architecture
- Retrieval and Generation Behavior
- Auto Embedding and Qdrant Sync
- Data Model
- Tech Stack and Tools
- Repository Structure
- Local Development Setup
- Environment Variables
- Scripts
- API Summary
- Troubleshooting
- Deployment (Vercel)
- Testing
- Roadmap

## Overview
This project combines a traditional book platform with an assistant that understands natural language requests such as:
- "i want a mystery investigative under 300 tk"
- "show me books by Sofia Navarro under 300"
- "recommend short thriller books"

Unlike basic keyword search, this assistant uses embeddings and vector retrieval to find semantically relevant books, then generates grounded answers using only retrieved items.

## What Is Implemented

### Core Application
- Customer signup/login with JWT
- Admin-protected book CRUD
- Customer order flow
- Catalog and detail pages
- Rate limiting and security logging

### Assistant + Classic RAG
- Chat endpoint with strict intent routing
- Greeting and non-search messages return zero recommendations
- Query embedding using `Xenova/all-MiniLM-L6-v2`
- Vector retrieval from Qdrant when available
- Automatic Mongo cosine fallback when Qdrant is unavailable
- Relevance threshold gating to avoid random suggestions
- Grounded LLM response from retrieved books only

### Recent Changes
- Migrated recommendation-heavy flow to classic RAG orchestration
- Removed memory-injected retrieval query construction
- Removed business-weight ranking from chat retrieval path
- Added `retrievedContext` in assistant response for transparency
- Added automatic embedding + Qdrant sync on book create/update
- Added Qdrant compatibility flag (`QDRANT_CHECK_COMPATIBILITY`)
- Added throttled fallback error logging for Qdrant outages

## Current RAG Architecture

### High-Level Flow
1. User sends a chat message.
2. Backend validates auth and message length.
3. Intent classifier checks greeting/empty/clarification.
4. If query intent requires retrieval:
   - Embed current user message (no memory/profile augmentation).
   - Retrieve semantic candidates via vector search.
   - Apply constraints from current message (genre/author/budget).
   - Gate by relevance threshold.
5. Generator produces grounded explanation from retrieved books.
6. Response returns assistant text + grounded recommendation cards.
7. Conversation stores transcript and retrievedBookIds per assistant turn.

### Runtime Components
- `backend/routes/assistantchat.js`
- `backend/services/ragRetriever.js`
- `backend/services/vectorSearchService.js`
- `backend/services/qdrantService.js`
- `backend/services/embeddingService.js`
- `backend/services/llmService.js`

## Retrieval and Generation Behavior

### Intent Routing
- Greeting/empty/clarification: assistant responds conversationally, recommendations array is empty.
- Retrieval intent: runs semantic retrieval and grounded generation.

### Retrieval Modes
- `QDRANT_ENABLED=1`: query vectors are searched in Qdrant first.
- Qdrant unavailable: falls back to Mongo cosine search automatically.
- `QDRANT_ENABLED=0`: always uses Mongo cosine search.

### Grounding Rules
- LLM is instructed to use only retrieved books.
- No invented titles/authors allowed.
- If context is weak or empty, assistant returns refinement guidance.

## Auto Embedding and Qdrant Sync

Book write operations now sync automatically:

### Create (`POST /books`)
- Save book payload
- Generate embedding from searchable text
- Store embedding and `semanticMetadata`
- Upsert vector point into Qdrant

### Update (`PUT /books/:id`)
- Update book data
- Regenerate embedding
- Update metadata
- Upsert updated point into Qdrant

### Delete (`DELETE /books/:id`)
- Delete from Mongo
- Delete vector point from Qdrant

Implementation is in `backend/routes/bookrouts.js`.

## Data Model

### Collections
- `users`
- `books`
- `orders`
- `chatmemories`

### Key Fields

User
- `preferences` (legacy preference fields for profile/feedback)
- `feedbackProfile` (like/dislike/click/view ids)
- `assistantMemory` (legacy summary metadata)

Book
- `title`, `author`, `genre`, `synopsis`, `price`, `rating`, etc.
- `embedding` (384-dim vector)
- `semanticMetadata` (`embeddedAt`, `modelVersion`)

ChatMemory
- `messages[]` with `role`, `content`, `retrievedBookIds`, `feedback`, `createdAt`
- `summary`
- `lastMessageAt`

## Tech Stack and Tools

### Backend
- Node.js
- Express 5
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- `bcryptjs`
- CORS
- `nodemon`

### AI / RAG
- `@xenova/transformers`
- Embedding model: `Xenova/all-MiniLM-L6-v2`
- Qdrant (`@qdrant/js-client-rest`) for vector retrieval
- Optional Groq text generation with local grounded fallback

### Frontend
- React 19
- Vite 7
- React Router 7
- Axios
- Zustand
- Tailwind CSS 4

### Testing
- Node test runner (`node --test`)
- `mongodb-memory-server`
- `supertest`

## Repository Structure

```text
backend/
  config.js
  index.js
  middleware/
  models/
  routes/
    assistantchat.js
    bookrouts.js
  scripts/
    embedBooks.mjs
    syncQdrant.mjs
  services/
    embeddingService.js
    llmService.js
    memoryService.js
    qdrantService.js
    ragRetriever.js
    recommendationService.js
    vectorSearchService.js
  utils/

frontend/
  api/
  src/
```

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm
- MongoDB local instance
- Optional Qdrant at `http://localhost:6333` (Docker or local binary)

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
Create `backend/.env` with required variables.

### 3) Seed catalog
```bash
cd backend
npm run seed:phase2
```

Optional richer data:
```bash
npm run seed:phase3
```

### 4) Run services

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
- Frontend: `http://localhost:5173`

### 5) Optional vector maintenance
```bash
cd backend
npm run embed:books
npm run qdrant:sync
```

## Environment Variables

Example `backend/.env`:

```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017/blog
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=change-this
JWT_EXPIRES_IN=7d

ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-bcrypt-hash

REQUIRE_GROQ_API_KEY=0
GROQ_API_KEY=

RATE_LIMIT_AUTH_LOGIN_PER_MINUTE=20
RATE_LIMIT_ASSISTANT_CHAT_PER_MINUTE=20
RATE_LIMIT_ASSISTANT_FEEDBACK_PER_MINUTE=40

QDRANT_ENABLED=1
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=books
QDRANT_SEARCH_LIMIT=40
QDRANT_CHECK_COMPATIBILITY=0

RAG_RELEVANCE_THRESHOLD=0.35
```

Notes:
- If Qdrant is not running, set `QDRANT_ENABLED=0` to avoid connection attempts.
- For local Qdrant without auth, keep `QDRANT_API_KEY=` empty.
- Keep `QDRANT_CHECK_COMPATIBILITY=0` for mixed/local setups.
- Never commit real secrets.

## Scripts

### Backend
```bash
npm run dev
npm run start
npm run test
npm run seed:phase2
npm run seed:phase3
npm run seed:rebuild-rich
npm run embed:books
npm run qdrant:sync
npm run backfill:phase1
```

### Frontend
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

### Assistant
- `POST /assistant/chat` (customer)
- `POST /assistant/feedback` (customer)

## Troubleshooting

### Qdrant unavailable, fallback to Mongo
Symptom:
- `Qdrant search unavailable, falling back to Mongo vector search: fetch failed`

Checks:
1. Ensure Qdrant service is running.
2. Verify `QDRANT_URL` is reachable (`http://localhost:6333/collections`).
3. Keep `QDRANT_CHECK_COMPATIBILITY=0` for local setup.
4. Restart backend after env updates.

### New books not searchable semantically
1. Create/update book via API/UI (auto embedding now runs there).
2. If historical books are missing embeddings, run:
```bash
cd backend
npm run embed:books
npm run qdrant:sync
```

### Frontend or backend dev server exits
- Check port conflicts and running processes.
- Restart terminals and run `npm run dev` in each project.

## Deployment (Vercel)

Use separate projects for backend and frontend.

Backend:
- Root: `backend`
- Set Mongo/JWT/rate-limit env vars
- Optional Qdrant env vars if vector DB is reachable from deployment

Frontend:
- Root: `frontend`
- Configure API proxy/runtime envs to backend URL

## Testing

Backend tests:
```bash
cd backend
npm test
```

Suggested coverage:
- Intent routing behavior
- Retrieval relevance gating
- Grounding guarantees
- CRUD vector sync behavior
- Rate limiting and auth checks

## Roadmap
- Add startup health probe for Qdrant with one-line status output
- Add automated integration tests for Qdrant fallback behavior
- Add fuzzy author normalization and typo tolerance
- Improve retrieval diagnostics for observability
