import { extractPreferenceSignals } from '../backend/services/memoryService.js';

const queries = [
  "i want mystery book",
  "mystery books under 300 tk",
  "Humayun Ahmed books under 300 tk",
  "books by Humayun Ahmed under 300",
  "books from Humayun Ahmed",
  "under 300 tk"
];

queries.forEach(q => {
  console.log(`Query: "${q}"`);
  const signals = extractPreferenceSignals(q);
  console.log('Signals:', JSON.stringify(signals, null, 2));
  console.log('---');
});
