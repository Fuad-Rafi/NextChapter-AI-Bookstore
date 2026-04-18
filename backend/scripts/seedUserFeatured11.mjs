import mongoose from 'mongoose';
import { mongoDBURL } from '../config.js';
import Book from '../models/bookmodels.js';

const featuredBooks = [
  {
    title: 'Hamlet',
    author: 'William Shakespeare',
    description: 'A tragic revenge drama about grief, corruption, and moral conflict in a royal court.',
    synopsis: 'Prince Hamlet is consumed by grief and doubt after his father\'s death and his mother\'s sudden remarriage. Driven by revenge and haunted by existential questions, he spirals through betrayal, madness, and moral paralysis in a deeply psychological tragedy.',
    genre: 'Classic Tragedy',
    tags: ['revenge', 'psychological', 'classic', 'philosophical'],
    themes: ['existential doubt', 'betrayal', 'death', 'moral conflict'],
    subjects: ['drama', 'literature'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('1603-01-01'),
    price: 240,
    rating: 4.7,
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    description: 'A reflective novel about following dreams and discovering purpose through a spiritual journey.',
    synopsis: 'Santiago, a young shepherd, travels in search of treasure but discovers deeper lessons about destiny, courage, and meaning. The story uses simple language and symbolism to explore inner growth, hope, and personal legend.',
    genre: 'Philosophical Fiction',
    tags: ['inspirational', 'spiritual', 'journey', 'self-discovery'],
    themes: ['destiny', 'purpose', 'growth', 'hope'],
    subjects: ['personal development', 'fiction'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('1988-01-01'),
    price: 280,
    rating: 4.5,
  },
  {
    title: 'The Lord of the Rings',
    author: 'J. R. R. Tolkien',
    description: 'An epic high-fantasy saga of friendship, sacrifice, and the struggle against darkness.',
    synopsis: 'A perilous quest to destroy a corrupting ring unfolds across Middle-earth. Through vast world-building and a rich ensemble cast, the story explores power, loyalty, endurance, and courage in the face of overwhelming evil.',
    genre: 'Epic Fantasy',
    tags: ['epic', 'quest', 'world-building', 'adventure'],
    themes: ['good vs evil', 'sacrifice', 'friendship', 'corruption of power'],
    subjects: ['fantasy', 'adventure'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('1954-07-29'),
    price: 520,
    rating: 4.9,
  },
  {
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    description: 'A practical finance book about behavior, mindset, and long-term decisions around money.',
    synopsis: 'Using short stories and examples, this book explains how emotions, habits, and risk perception shape financial outcomes. It focuses on realistic wealth-building, patience, and avoiding common decision traps.',
    genre: 'Personal Finance',
    tags: ['money mindset', 'investing', 'behavior', 'non-technical'],
    themes: ['long-term thinking', 'risk', 'discipline', 'decision-making'],
    subjects: ['finance', 'psychology'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('2020-09-08'),
    price: 360,
    rating: 4.8,
  },
  {
    title: 'Rich Dad Poor Dad',
    author: 'Robert Kiyosaki',
    description: 'A mindset-oriented personal finance classic focused on financial literacy and independence.',
    synopsis: 'Through contrasting lessons from two father figures, the book teaches assets vs liabilities, entrepreneurship, and passive income. It emphasizes changing how people think about work, money, and wealth creation.',
    genre: 'Personal Finance',
    tags: ['financial literacy', 'mindset', 'entrepreneurship', 'motivation'],
    themes: ['financial freedom', 'independence', 'wealth-building', 'self-improvement'],
    subjects: ['finance', 'business'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('1997-04-01'),
    price: 330,
    rating: 4.4,
  },
  {
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J. K. Rowling',
    description: 'A magical coming-of-age fantasy about friendship, wonder, and hidden danger.',
    synopsis: 'Harry enters a hidden wizarding world and begins life at Hogwarts, where friendship and mystery shape his first year. The story blends wonder, school adventure, and early confrontation with dark forces.',
    genre: 'Fantasy',
    tags: ['magic', 'school', 'coming-of-age', 'adventure'],
    themes: ['friendship', 'courage', 'identity', 'good vs evil'],
    subjects: ['fantasy', 'young adult'],
    language: 'English',
    audience: 'Young Adult',
    publishedDate: new Date('1997-06-26'),
    price: 300,
    rating: 4.9,
  },
  {
    title: 'Percy Jackson & the Olympians: The Lightning Thief',
    author: 'Rick Riordan',
    description: 'A humorous mythological fantasy adventure with a modern teenage hero.',
    synopsis: 'Percy discovers he is connected to Greek gods and is thrust into a dangerous quest. Fast pacing, humor, and action drive a story about belonging, friendship, and discovering hidden strength.',
    genre: 'Mythological Fantasy',
    tags: ['mythology', 'humor', 'quest', 'teen'],
    themes: ['identity', 'belonging', 'friendship', 'heroism'],
    subjects: ['fantasy', 'mythology'],
    language: 'English',
    audience: 'Young Adult',
    publishedDate: new Date('2005-06-28'),
    price: 290,
    rating: 4.6,
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    description: 'A classic social drama examining justice, prejudice, and moral growth.',
    synopsis: 'Seen through a child\'s eyes, this novel explores racial injustice and ethical courage in a small town. It combines courtroom tension with a deeply human coming-of-age narrative about empathy and conscience.',
    genre: 'Classic Fiction',
    tags: ['courtroom', 'social issues', 'classic', 'coming-of-age'],
    themes: ['justice', 'racism', 'morality', 'empathy'],
    subjects: ['society', 'law'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('1960-07-11'),
    price: 310,
    rating: 4.8,
  },
  {
    title: 'The Hunger Games',
    author: 'Suzanne Collins',
    description: 'A dystopian survival thriller with emotional intensity and political tension.',
    synopsis: 'Katniss enters a televised fight to the death in a deeply unequal society. The novel blends action, trauma, resistance, and moral conflict while exploring power, sacrifice, and rebellion.',
    genre: 'Dystopian Fiction',
    tags: ['survival', 'dystopia', 'action', 'rebellion'],
    themes: ['sacrifice', 'oppression', 'trauma', 'resistance'],
    subjects: ['dystopia', 'young adult'],
    language: 'English',
    audience: 'Young Adult',
    publishedDate: new Date('2008-09-14'),
    price: 320,
    rating: 4.7,
  },
  {
    title: 'The Fault in Our Stars',
    author: 'John Green',
    description: 'A bittersweet romantic tragedy about young love, mortality, and finding meaning in limited time.',
    synopsis: 'Hazel and Augustus fall in love while navigating life with terminal illness. Their relationship moves between humor, tenderness, and grief, creating an emotionally intense story about fleeting joy, existential reflection, and the pain of inevitable loss.',
    genre: 'Romance Drama',
    tags: ['sad romance', 'terminal illness', 'young love', 'heartbreaking'],
    themes: ['love and loss', 'mortality', 'existential reflection', 'emotional connection'],
    subjects: ['romance', 'young adult'],
    language: 'English',
    audience: 'Young Adult',
    publishedDate: new Date('2012-01-10'),
    price: 320,
    rating: 4.7,
  },
  {
    title: 'The Kite Runner',
    author: 'Khaled Hosseini',
    description: 'An emotional historical drama about guilt, betrayal, and the search for redemption.',
    synopsis: 'A childhood friendship fractured by betrayal haunts Amir across decades of exile and conflict. Set against Afghanistan\'s upheaval, the novel explores regret, trauma, and the painful path toward moral repair.',
    genre: 'Historical Drama',
    tags: ['redemption', 'emotional', 'friendship', 'war'],
    themes: ['guilt', 'betrayal', 'forgiveness', 'healing'],
    subjects: ['history', 'family'],
    language: 'English',
    audience: 'Adult',
    publishedDate: new Date('2003-05-29'),
    price: 340,
    rating: 4.7,
  },
];

const asSelectors = featuredBooks.map((book) => ({ title: book.title, author: book.author }));

const run = async () => {
  await mongoose.connect(mongoDBURL);

  const bulkOps = featuredBooks.map((book) => ({
    updateOne: {
      filter: { title: book.title, author: book.author },
      update: {
        $set: {
          ...book,
          isPublished: true,
          isFeatured: true,
        },
      },
      upsert: true,
    },
  }));

  await Book.bulkWrite(bulkOps);

  await Book.updateMany(
    {
      $nor: asSelectors,
    },
    {
      $set: { isFeatured: false },
    }
  );

  const featured = await Book.find({ isFeatured: true }).sort({ title: 1 }).select('title author -_id');

  console.log(`Featured books set to ${featured.length}`);
  for (const book of featured) {
    console.log(`- ${book.title} — ${book.author}`);
  }

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error('Failed to seed featured books:', error);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors
  }
  process.exit(1);
});
