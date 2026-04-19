import { extractPreferenceSignals } from '../backend/services/memoryService.js';

const queries = [
  "give me some iris moore books",
  "iris moore books under 300 tk",
  "give me some iris moore books under 300 tk",
  "show me nina hale books",
  "i want mystery books",
  "mystery books under 250 tk",
  "Humayun Ahmed books under 300 tk",
  "books by Humayun Ahmed under 300",
  "books from Humayun Ahmed",
  "books by Nina Hale",
  "i want a thriller",
  "under 300 tk",
  "hi",
  "give me some books under 300",
];

console.log('=== Signal Extraction Test Results ===\n');
queries.forEach(q => {
  const s = extractPreferenceSignals(q);
  const parts = [];
  if (s.preferredAuthors.length) parts.push(`Authors: [${s.preferredAuthors.join(', ')}]`);
  if (s.preferredGenres.length) parts.push(`Genres: [${s.preferredGenres.join(', ')}]`);
  if (s.budgetMax !== null) parts.push(`Max Price: ${s.budgetMax} tk`);
  if (s.budgetMin !== null) parts.push(`Min Price: ${s.budgetMin} tk`);
  const result = parts.length ? parts.join(' | ') : '⚠️  No signals extracted';
  console.log(`"${q}"\n  → ${result}\n`);
});
