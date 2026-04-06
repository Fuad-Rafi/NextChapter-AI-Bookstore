import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import Book from '../models/bookmodels.js';
import Order from '../models/ordermodel.js';
import User from '../models/usermodel.js';
import {
  buildBookSearchText,
  normalizeBookPayload,
  normalizeOrderPayload,
  normalizeStringList,
  normalizeUserPreferences,
} from '../utils/ragData.js';

let mongoServer;
let request;

before(async () => {
  process.env.VERCEL = '1';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase1-test-secret';

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URL = mongoServer.getUri('blog-phase1-test');
  global.mongooseConnection = null;

  await mongoose.connect(process.env.MONGODB_URL);

  const { default: app } = await import('../index.js');
  const supertest = (await import('supertest')).default;
  request = supertest(app);
});

after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  global.mongooseConnection = null;
});

const createToken = (role = 'admin') => jwt.sign({ role, id: new mongoose.Types.ObjectId().toString() }, process.env.JWT_SECRET);

test('normalizes list-like preference inputs', () => {
  assert.deepEqual(normalizeStringList([' Mystery ', 'thriller', 'mystery', '']), ['Mystery', 'thriller']);
  assert.deepEqual(normalizeStringList('romance, sci-fi, romance'), ['romance', 'sci-fi']);
});

test('normalizes user preferences from signup payload shape', () => {
  const preferences = normalizeUserPreferences({
    preferredGenres: ['Fantasy', '  Mystery '],
    dislikedGenres: 'horror, gore',
    favoriteAuthors: ['Terry Pratchett'],
    favoriteThemes: ['found family'],
    tonePreferences: ['lighthearted'],
    readingGoals: ['escape'],
    preferredLanguage: ' en ',
    budgetRange: { min: '10', max: '25' },
    notes: '   likes fast reads   ',
  });

  assert.deepEqual(preferences.preferredGenres, ['Fantasy', 'Mystery']);
  assert.deepEqual(preferences.dislikedGenres, ['horror', 'gore']);
  assert.equal(preferences.preferredLanguage, 'en');
  assert.deepEqual(preferences.budgetRange, { min: 10, max: 25 });
  assert.equal(preferences.notes, 'likes fast reads');
});

test('builds searchable text for a book', () => {
  const searchText = buildBookSearchText({
    title: 'Dune',
    author: 'Frank Herbert',
    description: 'A desert planet epic',
    genre: 'Science Fiction',
    tags: ['classic', 'epic'],
    themes: ['politics'],
    subjects: ['space'],
    language: 'English',
    audience: 'Adult',
  });

  assert.match(searchText, /dune/);
  assert.match(searchText, /frank herbert/);
  assert.match(searchText, /science fiction/);
  assert.match(searchText, /classic/);
});

test('normalizes book payloads for phase 1 metadata', () => {
  const payload = normalizeBookPayload({
    title: '  Dune  ',
    author: ' Frank Herbert ',
    description: '  A desert planet epic  ',
    synopsis: '  A desert planet epic  ',
    genre: ' Science Fiction ',
    tags: ['classic', 'epic', 'classic'],
    themes: 'politics, survival',
    subjects: ['space', 'desert'],
    language: ' English ',
    audience: ' Adult ',
    publishedDate: '1965-08-01',
    coverImage: 'https://example.com/dune.jpg',
    price: '19.99',
    rating: '4.5',
    isPublished: 'true',
  });

  assert.equal(payload.title, 'Dune');
  assert.equal(payload.author, 'Frank Herbert');
  assert.equal(payload.synopsis, 'A desert planet epic');
  assert.deepEqual(payload.tags, ['classic', 'epic']);
  assert.deepEqual(payload.themes, ['politics', 'survival']);
  assert.equal(payload.price, 19.99);
  assert.equal(payload.rating, 4.5);
  assert.equal(payload.isPublished, true);
  assert.match(payload.searchText, /dune/);
});

test('normalizes order payloads with customer and book references', () => {
  const payload = normalizeOrderPayload({
    bookId: '507f1f77bcf86cd799439011',
    bookTitle: 'Dune',
    bookAuthor: 'Frank Herbert',
    customerName: '  Sam  ',
    customerAddress: '  12 Main St  ',
    customerPhone: ' 1234567890 ',
  }, '507f1f77bcf86cd799439012');

  assert.equal(payload.bookId, '507f1f77bcf86cd799439011');
  assert.equal(payload.customerName, 'Sam');
  assert.equal(payload.customerAddress, '12 Main St');
  assert.equal(payload.customerPhone, '1234567890');
  assert.ok(payload.bookRef);
  assert.ok(payload.customerId);
});

test('book schema stores phase 1 metadata and defaults', async () => {
  const book = new Book({
    title: 'Dune',
    author: 'Frank Herbert',
    publishedDate: new Date('1965-08-01'),
    description: 'A desert planet epic',
    synopsis: 'A desert planet epic',
    genre: 'Science Fiction',
    tags: ['classic'],
    themes: ['politics'],
    rating: 4.8,
  });

  await book.validate();

  assert.equal(book.isPublished, true);
  assert.equal(book.rating, 4.8);
  assert.equal(book.synopsis, 'A desert planet epic');
  assert.deepEqual(book.tags, ['classic']);
  assert.match(book.searchText, /dune/);
});

test('user schema stores reading preferences and assistant memory', async () => {
  const user = new User({
    name: 'Sam',
    email: 'SAM@example.com',
    password: 'hashed-password',
    preferences: {
      preferredGenres: ['Mystery'],
      budgetRange: { min: 5, max: 15 },
    },
    assistantMemory: {
      chatSummary: 'Likes fast-paced mysteries',
    },
  });

  await user.validate();

  assert.equal(user.email, 'sam@example.com');
  assert.deepEqual(user.preferences.preferredGenres, ['Mystery']);
  assert.equal(user.preferences.budgetRange.min, 5);
  assert.equal(user.preferences.budgetRange.max, 15);
  assert.equal(user.assistantMemory.chatSummary, 'Likes fast-paced mysteries');
});

test('order schema stores book and customer references', async () => {
  const order = new Order({
    bookId: '507f1f77bcf86cd799439011',
    bookRef: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    customerId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
    bookTitle: 'Dune',
    bookAuthor: 'Frank Herbert',
    customerName: 'Sam',
    customerAddress: '12 Main St',
    customerPhone: '1234567890',
  });

  await order.validate();

  assert.equal(order.bookId, '507f1f77bcf86cd799439011');
  assert.ok(order.bookRef);
  assert.ok(order.customerId);
});

test('API creates and reads books with new retrieval fields', async () => {
  const adminToken = createToken('admin');

  const createResponse = await request
    .post('/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Phase One API Book',
      author: 'QA Bot',
      description: 'A metadata-rich test book.',
      synopsis: 'A metadata-rich test book.',
      genre: 'Testing',
      tags: ['api', 'metadata'],
      themes: ['quality'],
      subjects: ['engineering'],
      language: 'English',
      audience: 'Adult',
      publishedDate: '2025-01-01',
      price: 499,
      rating: 4.2,
      isPublished: true,
    });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.rating, 4.2);
  assert.equal(createResponse.body.genre, 'Testing');
  assert.equal(createResponse.body.synopsis, 'A metadata-rich test book.');
  assert.deepEqual(createResponse.body.tags, ['api', 'metadata']);

  const listResponse = await request.get('/books');
  assert.equal(listResponse.status, 200);
  assert.ok(listResponse.body.books.some((book) => book.title === 'Phase One API Book'));
});

test('API allows customer reads to see every book', async () => {
  const adminToken = createToken('admin');
  const customerToken = createToken('customer');

  const unpublishedResponse = await request
    .post('/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Hidden Draft Book',
      author: 'QA Bot',
      description: 'Should still be visible to customers in the full catalog.',
      synopsis: 'Should still be visible to customers in the full catalog.',
      genre: 'Testing',
      tags: ['draft'],
      themes: ['visibility'],
      language: 'English',
      audience: 'Adult',
      publishedDate: '2025-01-02',
      price: 220,
      rating: 3.9,
      isPublished: false,
    });

  assert.equal(unpublishedResponse.status, 201);
  const hiddenId = unpublishedResponse.body._id;

  const customerList = await request
    .get('/books')
    .set('Authorization', `Bearer ${customerToken}`);
  assert.equal(customerList.status, 200);
  assert.equal(customerList.body.books.some((book) => book._id === hiddenId), true);

  const adminList = await request
    .get('/books')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(adminList.status, 200);
  assert.equal(adminList.body.books.some((book) => book._id === hiddenId), true);

  const customerBook = await request
    .get(`/books/${hiddenId}`)
    .set('Authorization', `Bearer ${customerToken}`);
  assert.equal(customerBook.status, 200);
  assert.equal(customerBook.body._id, hiddenId);

  const adminBook = await request
    .get(`/books/${hiddenId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(adminBook.status, 200);
  assert.equal(adminBook.body._id, hiddenId);
});

test('customer book list still shows ordered books', async () => {
  const adminToken = createToken('admin');
  const customerToken = createToken('customer');

  const orderedBookResponse = await request
    .post('/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Ordered Book Still Visible',
      author: 'QA Bot',
      description: 'A book that has already been ordered once.',
      synopsis: 'A book that has already been ordered once.',
      genre: 'Testing',
      tags: ['ordered'],
      themes: ['visibility'],
      language: 'English',
      audience: 'Adult',
      publishedDate: '2025-01-03',
      price: 300,
      rating: 4.0,
      isPublished: true,
    });

  assert.equal(orderedBookResponse.status, 201);

  const orderedBookId = orderedBookResponse.body._id;

  const orderResponse = await request
    .post('/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      bookId: orderedBookId,
      bookTitle: orderedBookResponse.body.title,
      bookAuthor: orderedBookResponse.body.author,
      customerName: 'Customer One',
      customerAddress: 'Dhaka',
      customerPhone: '0123456789',
    });

  assert.equal(orderResponse.status, 201);

  const customerList = await request
    .get('/books')
    .set('Authorization', `Bearer ${customerToken}`);

  assert.equal(customerList.status, 200);
  assert.equal(customerList.body.books.some((book) => book._id === orderedBookId), true);
});
