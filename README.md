
# MERN Book Platform with RAG Assistant

**Last updated:** 2026-04-19

A full-stack MERN application for book catalog browsing, ordering, and AI-assisted retrieval using a classic RAG (Retrieval-Augmented Generation) architecture.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Backend](#backend)
- [Frontend](#frontend)
- [AI/RAG System](#airag-system)
- [Data Model](#data-model)
- [Repository Structure](#repository-structure)
- [Setup & Development](#setup--development)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Overview

This project is a modern book platform with:
- Customer and admin flows (signup, login, book CRUD, order management)
- AI-powered assistant for natural language book recommendations
- Semantic search and RAG-based chat using Qdrant and MongoDB
- Modern React/Next.js frontend with Tailwind CSS

---

## Features

### Core Application
- Customer signup/login (JWT-based)
- Admin-protected book CRUD
- Customer order flow
- Catalog, detail, and order pages
- Rate limiting and security logging

### Assistant & RAG
- Chat endpoint with intent routing (greeting, search, clarification)
- Query embedding with `Xenova/all-MiniLM-L6-v2`
- Vector retrieval from Qdrant (with Mongo fallback)
- Relevance threshold gating
- Grounded LLM responses (no hallucinated books)
- Transparent retrieval context in responses
- Automatic embedding & Qdrant sync on book create/update

### Recent Improvements
- Classic RAG orchestration for recommendations
- Qdrant compatibility flag and error logging
- Automatic fallback to Mongo search if Qdrant is down
- Improved feedback and memory summary in chat

---

## Architecture

### High-Level Flow
1. User sends a chat message
2. Backend validates and classifies intent
3. If retrieval needed:
   - Embed message
   - Semantic vector search (Qdrant or Mongo)
   - Apply constraints (genre, author, budget)
   - Gate by relevance threshold
4. LLM generates grounded response from retrieved books
5. Response includes assistant text, recommendations, and retrieval context
6. Conversation memory is updated

### Key Backend Components
- `backend/routes/assistantchat.js` (chat endpoint)
- `backend/services/ragRetriever.js` (retrieval logic)
- `backend/services/vectorSearchService.js` (vector search)
- `backend/services/qdrantService.js` (Qdrant integration)
- `backend/services/embeddingService.js` (embeddings)
- `backend/services/llmService.js` (LLM responses)

---

## Backend

- Node.js (Express 5)
- MongoDB (Mongoose)
- JWT authentication
- Qdrant for vector search (optional)
- Modular services for embedding, retrieval, and LLM
- Rate limiting and CORS
- Scripts for seeding, embedding, and Qdrant sync

#### Main Endpoints
- `/books` (CRUD)
- `/orders` (order management)
- `/assistant/chat` (AI chat)
- `/auth` (auth)
- `/admin` (seed & admin)

---

## Frontend

- React 19, Next.js 15
- Tailwind CSS 4
- Zustand for state management
- Axios for API calls
- Modern app directory structure (Next.js)
- Pages for catalog, book details, admin, orders, login/signup, assistant chat

---

## AI/RAG System

- Embedding model: `Xenova/all-MiniLM-L6-v2` (via `@xenova/transformers`)
- Qdrant (`@qdrant/js-client-rest`) for vector retrieval
- Fallback to MongoDB cosine search if Qdrant is unavailable
- LLM generation (optionally Groq, with local fallback)
- Strict grounding: LLM can only use retrieved books
- Automatic embedding and Qdrant sync on book create/update/delete

---

## Data Model

### MongoDB Collections
- `users`: preferences, feedback, assistant memory
- `books`: title, author, genre, synopsis, price, rating, embedding, semantic metadata
- `orders`: order details
- `chatmemories`: chat history, retrieved book IDs, feedback, summary

---

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
    ...
  scripts/
    embedBooks.mjs
    syncQdrant.mjs
    ...
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
    app/
    assets/
    components/
    context/
    hooks/
    store/
    utils/
```

---

## Setup & Development

### Prerequisites
- Node.js 18+
- npm
- MongoDB (local or remote)
- (Optional) Qdrant at `http://localhost:6333` (Docker or binary)

### 1. Install dependencies

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

### 2. Configure environment
Copy `backend/.env.example` to `backend/.env` and fill in required values.

### 3. Seed catalog
```bash
cd backend
npm run seed:phase2
# For richer data:
- Backend: `http://localhost:5000`
```

### 4. Run services

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
- Frontend: `http://localhost:3002`

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
CORS_ORIGIN=http://localhost:3002

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
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3002
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
- Configure `NEXT_PUBLIC_API_URL` to the deployed backend URL if you want direct browser-to-backend calls
- Configure `BACKEND_URL` if you want to use the Vercel proxy route under `/api`
- Configure `NEXT_PUBLIC_SITE_URL` for sitemap and metadata generation
- Do not use localhost rewrites in production

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
