import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Adjusting path to reach the 'seed .txt' in the project root
const SEED_FILE_PATH = path.resolve(__dirname, '../../seed .txt');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '../../seed.books.json');

const parseBooks = (content) => {
  const books = [];
  // Split by the book icon to get individual blocks
  const blocks = content.split(/📚 \d+\./g).filter(b => b.trim() !== '');

  blocks.forEach((block) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) return;

    // 1. Parse Title and Author
    // Look for various title/author separators if found
    const headerLine = lines[0];
    const headerMatch = headerLine.match(/(.*?) — by (.*)/) || headerLine.match(/(.*?) by (.*)/);
    
    if (!headerMatch) return;
    const title = headerMatch[1].trim();
    const author = headerMatch[2].trim();

    // 2. Parse Year and Price
    // Price might have different symbols or formatting
    const metaLine = lines[1];
    const metaMatch = metaLine.match(/Year:\s*(\d+).*?Price:\s*[৳\d,]+/);
    const year = metaMatch ? parseInt(metaMatch[1]) : 2000;
    
    // Extract numbers from the price section
    const priceMatch = metaLine.match(/Price:\s*[৳]?\s*(\d+)/);
    const price = priceMatch ? parseInt(priceMatch[1]) : 300;

    // 3. Parse Description and Synopsis
    const fullText = lines.slice(2).join(' ');
    
    // Extract tags from the "Fits/Ideal for..." sections
    // This looks for anything inside curved or straight quotes
    const tagMatches = fullText.match(/[“"']([^”"']+)[”"']/g) || [];
    const tags = tagMatches.map(t => t.replace(/[“"”"]/g, '').trim()).filter(t => t.length > 2);

    // Determine Genre from the first few words or context
    const genreKeywords = ['mystery', 'thriller', 'science fiction', 'fantasy', 'romance', 'horror', 'historical', 'non-fiction', 'poetry', 'self-help', 'dystopian', 'drama'];
    let genre = 'General';
    const lowerText = fullText.toLowerCase();
    
    for (const g of genreKeywords) {
      if (lowerText.includes(g)) {
        genre = g.charAt(0).toUpperCase() + g.slice(1);
        break;
      }
    }

    // Generate a Random Date within that year for valid publishedDate
    const randomMonth = Math.floor(Math.random() * 12);
    const randomDay = Math.floor(Math.random() * 28) + 1;
    const publishedDate = new Date(year, randomMonth, randomDay);

    books.push({
      title,
      author,
      description: lines[2]?.substring(0, 500) || '', 
      synopsis: fullText,
      genre,
      tags: tags.slice(0, 8),
      themes: tags.slice(0, 5),
      subjects: [genre],
      language: 'English',
      audience: lowerText.includes('young adult') || lowerText.includes('teen') ? 'Young Adult' : 'Adult',
      publishedDate,
      price: Math.max(200, Math.min(700, price)), // Enforce schema limits
      rating: Number((Math.random() * (4.9 - 3.8) + 3.8).toFixed(1)),
      isPublished: true,
    });
  });

  return books;
};

const run = () => {
  try {
    if (!fs.existsSync(SEED_FILE_PATH)) {
      throw new Error(`Seed file not found at: ${SEED_FILE_PATH}`);
    }

    console.log('Reading seed file...');
    const content = fs.readFileSync(SEED_FILE_PATH, 'utf-8');
    const books = parseBooks(content);

    if (books.length === 0) {
      throw new Error('No books were successfully parsed. Check file format.');
    }

    console.log(`Parsed ${books.length} books.`);
    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(books, null, 2), 'utf-8');
    console.log(`✓ Books written to ${OUTPUT_FILE_PATH}`);
  } catch (error) {
    console.error('✗ Seed file creation failed:', error.message);
    process.exit(1);
  }
};

run();
