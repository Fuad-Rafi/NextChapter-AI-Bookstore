import mongoose from 'mongoose';
import { mongoDBURL } from '../config.js';
import Book from '../models/bookmodels.js';
import * as embeddingService from '../services/embeddingService.js';
import {
  isQdrantEnabled,
  resetQdrantCollection,
  upsertBookPoint,
} from '../services/qdrantService.js';

const EMBEDDING_MODEL_VERSION = 'Xenova/all-MiniLM-L6-v2';
const BOOKS_PER_GENRE = 10;

const genreProfiles = [
  {
    genre: 'Mystery',
    bookType: 'investigative mystery novel',
    audience: 'Adult',
    tags: ['investigation', 'suspense', 'detective', 'atmospheric'],
    themes: ['truth', 'deception', 'justice', 'obsession'],
    subjects: ['crime', 'cold cases', 'forensics'],
    settings: ['fog-bound harbor district', 'retired mountain resort', 'historic university archive'],
    protagonists: ['forensic linguist', 'disgraced inspector', 'small-town magistrate'],
    conflicts: ['a staged alibi network', 'a vanished witness ledger', 'a family pact built on silence'],
    stakes: ['a wrongful conviction', 'a municipal election', 'the last chance to solve a twenty-year-old case'],
    tones: ['slow-burning', 'psychological', 'twist-heavy'],
    titleWords: ['Harbor', 'Ledger', 'Motive', 'Cipher', 'Whisper', 'Lantern', 'Threshold'],
    titleHooks: ['of Quiet Evidence', 'at Blackwater Hill', 'Beneath the Brass Clock'],
  },
  {
    genre: 'Thriller',
    bookType: 'high-stakes thriller',
    audience: 'Adult',
    tags: ['fast-paced', 'conspiracy', 'cat-and-mouse', 'urgent'],
    themes: ['power', 'survival', 'trust', 'moral compromise'],
    subjects: ['intelligence', 'cybersecurity', 'state secrecy'],
    settings: ['surveillance-dense capital city', 'offshore data bunker', 'failing satellite command center'],
    protagonists: ['ethical hacker', 'emergency response analyst', 'former intelligence courier'],
    conflicts: ['a leaked biometric blacklist', 'a false-flag operation', 'an encrypted dead-man protocol'],
    stakes: ['critical infrastructure collapse', 'mass identity theft', 'a diplomatic crisis'],
    tones: ['adrenaline-fueled', 'political', 'cinematic'],
    titleWords: ['Protocol', 'Vector', 'Containment', 'Signal', 'Fallback', 'Firewall', 'Deadline'],
    titleHooks: ['Before Zero Hour', 'Inside the Red Zone', 'Under Silent Sirens'],
  },
  {
    genre: 'Science Fiction',
    bookType: 'speculative science fiction novel',
    audience: 'Adult',
    tags: ['future-tech', 'big-ideas', 'space', 'thought-provoking'],
    themes: ['identity', 'ethics', 'adaptation', 'collective memory'],
    subjects: ['artificial intelligence', 'astroengineering', 'quantum communication'],
    settings: ['orbital manufacturing ring', 'terraforming colony', 'deep-space research relay'],
    protagonists: ['systems biologist', 'xenoarchaeology pilot', 'orbital habitat mediator'],
    conflicts: ['a sentient maintenance mesh', 'a mission timeline paradox', 'a colony governance schism'],
    stakes: ['planetary habitability', 'human-AI coexistence', 'interstellar treaty collapse'],
    tones: ['concept-driven', 'expansive', 'emotionally grounded'],
    titleWords: ['Orbit', 'Parallax', 'Helios', 'Drift', 'Frontier', 'Epoch', 'Singularity'],
    titleHooks: ['After the Ninth Horizon', 'Within the Hollow Nebula', 'at the Gravity Line'],
  },
  {
    genre: 'Fantasy',
    bookType: 'epic fantasy adventure',
    audience: 'Young Adult',
    tags: ['worldbuilding', 'magic', 'quest', 'mythic'],
    themes: ['legacy', 'belonging', 'sacrifice', 'courage'],
    subjects: ['arcane orders', 'ancient maps', 'kingdom politics'],
    settings: ['storm-forged archipelago', 'library-city of living runes', 'mountain citadel of oathkeepers'],
    protagonists: ['apprentice mapmaker', 'exiled archivist', 'runebound courier'],
    conflicts: ['a fractured succession pact', 'a forbidden weather spell', 'a missing treaty sigil'],
    stakes: ['kingdom-wide famine', 'war between allied houses', 'collapse of protective wards'],
    tones: ['immersive', 'heroic', 'lore-rich'],
    titleWords: ['Runes', 'Crown', 'Warden', 'Tide', 'Bastion', 'Sigil', 'Thorn'],
    titleHooks: ['of Ember Courts', 'Beyond the Silver Gate', 'and the Storm Oath'],
  },
  {
    genre: 'Romance',
    bookType: 'contemporary romance novel',
    audience: 'Adult',
    tags: ['character-driven', 'emotional', 'slow-burn', 'hopeful'],
    themes: ['vulnerability', 'healing', 'second chances', 'trust'],
    subjects: ['relationships', 'community', 'career transitions'],
    settings: ['coastal art district', 'mountain town book festival', 'renovated train-station market'],
    protagonists: ['community radio host', 'heritage architect', 'independent bookstore buyer'],
    conflicts: ['a public misunderstanding', 'competing life plans', 'an unresolved family rift'],
    stakes: ['closing a beloved local business', 'losing shared custody trust', 'abandoning a long-held dream'],
    tones: ['warm', 'intimate', 'dialogue-forward'],
    titleWords: ['Letters', 'Autumn', 'Harbor', 'Lantern', 'Blueprint', 'Cedar', 'Sundown'],
    titleHooks: ['Between Late Trains', 'at Magnolia Square', 'for a Braver Tomorrow'],
  },
  {
    genre: 'Historical Fiction',
    bookType: 'historical fiction saga',
    audience: 'Adult',
    tags: ['period-detail', 'multi-generational', 'dramatic', 'immersive'],
    themes: ['migration', 'identity', 'memory', 'resilience'],
    subjects: ['labor history', 'war correspondence', 'urban change'],
    settings: ['postwar river port', 'colonial-era textile town', 'interwar railway settlement'],
    protagonists: ['union organizer', 'field nurse turned reporter', 'family printshop heir'],
    conflicts: ['a censored dispatch archive', 'a disputed land deed', 'a strike broken by sabotage'],
    stakes: ['family livelihood', 'community displacement', 'historical truth erased from records'],
    tones: ['sweeping', 'research-rich', 'heartfelt'],
    titleWords: ['River', 'Dispatch', 'Archive', 'Foundry', 'Rail', 'Ink', 'Empire'],
    titleHooks: ['in Winter Dust', 'of the Broken Telegraph', 'After the Iron Bell'],
  },
  {
    genre: 'Literary Fiction',
    bookType: 'literary character study',
    audience: 'Adult',
    tags: ['reflective', 'atmospheric', 'language-rich', 'quietly intense'],
    themes: ['grief', 'memory', 'art', 'belonging'],
    subjects: ['family stories', 'city life', 'creative process'],
    settings: ['old cinema quarter', 'riverfront apartment block', 'artist residency in a former observatory'],
    protagonists: ['museum conservator', 'essayist on assignment', 'night-shift projectionist'],
    conflicts: ['a rewritten family narrative', 'an unfinished manuscript debt', 'a friendship strained by success'],
    stakes: ['loss of artistic voice', 'ruptured family reconciliation', 'public exposure of private history'],
    tones: ['lyrical', 'subtle', 'introspective'],
    titleWords: ['Silence', 'Rooms', 'Lantern', 'Margins', 'Echo', 'Portrait', 'Threshold'],
    titleHooks: ['for the Unspoken', 'in Dustlight', 'at the Last Screening'],
  },
  {
    genre: 'Young Adult',
    bookType: 'young adult coming-of-age novel',
    audience: 'Teen',
    tags: ['coming-of-age', 'friendship', 'identity', 'hopeful'],
    themes: ['self-discovery', 'loyalty', 'courage', 'change'],
    subjects: ['school life', 'family expectations', 'creative ambitions'],
    settings: ['competitive arts high school', 'science fair circuit', 'summer debate residency'],
    protagonists: ['scholarship drummer', 'first-generation coder', 'student journalist'],
    conflicts: ['a viral rumor spiral', 'a mentorship betrayal', 'a scholarship eligibility challenge'],
    stakes: ['future college path', 'friendship circle rupture', 'losing a long-planned competition'],
    tones: ['energetic', 'relatable', 'emotionally honest'],
    titleWords: ['Summer', 'Spark', 'Hallway', 'Notebook', 'Signal', 'Skyline', 'Pulse'],
    titleHooks: ['Before Finals Week', 'of the Brave Classroom', 'and the Open Mic'],
  },
  {
    genre: 'Self Help',
    bookType: 'practical self-help guide',
    audience: 'Adult',
    tags: ['practical', 'habit-building', 'mindset', 'actionable'],
    themes: ['discipline', 'clarity', 'resilience', 'balance'],
    subjects: ['time management', 'emotional regulation', 'goal systems'],
    settings: ['busy professional routines', 'remote work contexts', 'high-stress caregiving schedules'],
    protagonists: ['behavioral coach', 'occupational therapist', 'leadership mentor'],
    conflicts: ['burnout cycles', 'decision fatigue', 'inconsistent routines'],
    stakes: ['career stagnation', 'relationship strain', 'health decline'],
    tones: ['encouraging', 'evidence-based', 'step-by-step'],
    titleWords: ['Focus', 'Habit', 'Reset', 'Clarity', 'Routine', 'Momentum', 'Anchor'],
    titleHooks: ['for Hard Weeks', 'Without Burnout', 'in 10 Minute Blocks'],
  },
  {
    genre: 'Business',
    bookType: 'business strategy handbook',
    audience: 'Adult',
    tags: ['leadership', 'operations', 'strategy', 'decision-making'],
    themes: ['accountability', 'execution', 'adaptability', 'team trust'],
    subjects: ['product strategy', 'organizational design', 'customer research'],
    settings: ['scaling startup teams', 'post-merger integration rooms', 'cross-functional planning cycles'],
    protagonists: ['operations executive', 'founder-coach', 'product turnaround specialist'],
    conflicts: ['misaligned incentives', 'fragile delivery timelines', 'conflicting board mandates'],
    stakes: ['cash flow runway', 'team attrition', 'market share erosion'],
    tones: ['framework-oriented', 'direct', 'case-study-driven'],
    titleWords: ['Leverage', 'Cadence', 'Runway', 'Operator', 'Signal', 'Northstar', 'Blueprint'],
    titleHooks: ['for Real Teams', 'Beyond Slide Decks', 'When Growth Turns Chaotic'],
  },
  {
    genre: 'Horror',
    bookType: 'psychological horror novel',
    audience: 'Adult',
    tags: ['dark', 'psychological', 'haunting', 'atmospheric'],
    themes: ['fear', 'guilt', 'isolation', 'obsession'],
    subjects: ['haunted spaces', 'small-town legends', 'unreliable memory'],
    settings: ['abandoned sanatorium grounds', 'storm-isolated chapel island', 'suburban development over burial marsh'],
    protagonists: ['trauma counselor', 'night watch electrician', 'local history podcaster'],
    conflicts: ['a recurring sleepwalking map', 'voices tied to old land surveys', 'a ritual hidden in civic records'],
    stakes: ['community panic', 'loss of sanity', 'repeat of a historic mass tragedy'],
    tones: ['creeping', 'claustrophobic', 'nightmarish'],
    titleWords: ['Chapel', 'Hollow', 'Ash', 'Bone', 'Ritual', 'Mire', 'Silence'],
    titleHooks: ['Under Flooded Bells', 'of the Last Parish', 'Beyond the Marshlight'],
  },
  {
    genre: 'Nonfiction',
    bookType: 'narrative nonfiction exploration',
    audience: 'Adult',
    tags: ['research-backed', 'accessible', 'insightful', 'story-led'],
    themes: ['systems thinking', 'social change', 'evidence', 'accountability'],
    subjects: ['public health', 'education policy', 'digital culture'],
    settings: ['field interviews across cities', 'policy hearings', 'community pilot programs'],
    protagonists: ['investigative reporter', 'policy analyst', 'documentary researcher'],
    conflicts: ['data gaps across districts', 'misleading headline incentives', 'funding models that reward short-term wins'],
    stakes: ['public trust erosion', 'worsening inequity', 'policy failure at national scale'],
    tones: ['clear-eyed', 'analytical', 'human-centered'],
    titleWords: ['Evidence', 'Systems', 'Cities', 'Proof', 'Signal', 'Change', 'Ledger'],
    titleHooks: ['That Actually Works', 'for a Shared Future', 'Behind the Metrics'],
  },
];

const firstNames = [
  'Avery', 'Mina', 'Noah', 'Leila', 'Ronan', 'Sofia', 'Elias', 'Priya', 'Jonah', 'Camila',
  'Harper', 'Imran', 'Talia', 'Felix', 'Nadia', 'Theo', 'Keira', 'Arjun', 'Maya', 'Dante',
  'Elena', 'Rafael', 'Nora', 'Zaid', 'Lena', 'Iris', 'Kieran', 'Amina', 'Julian', 'Farah',
];

const lastNames = [
  'Mercer', 'Rahman', 'Santos', 'Ishikawa', 'Bennett', 'Chowdhury', 'Morrison', 'Patel',
  'Navarro', 'Khan', 'Sullivan', 'Duarte', 'Greene', 'Abbasi', 'Larsen', 'Okafor',
  'Vasquez', 'Hale', 'Costa', 'Bishop', 'Almeida', 'Reyes', 'Fischer', 'Qureshi',
  'Sinclair', 'Rowe', 'Malik', 'Mendez', 'Torres', 'Whitaker',
];

const pick = (arr, index) => arr[index % arr.length];

const buildTitle = (profile, index, usedTitles) => {
  const core = `${pick(profile.titleWords, index)} ${pick(profile.titleWords, index + 3)}`;
  const hook = pick(profile.titleHooks, index + 5);
  let title = `${core} ${hook}`;

  if (usedTitles.has(title.toLowerCase())) {
    title = `${title} ${index + 1}`;
  }

  usedTitles.add(title.toLowerCase());
  return title;
};

const buildAuthor = (index) => {
  const first = pick(firstNames, index * 2 + 1);
  const last = pick(lastNames, index * 3 + 2);
  return `${first} ${last}`;
};

const buildSynopsis = (profile, index, title, author) => {
  const setting = pick(profile.settings, index);
  const protagonist = pick(profile.protagonists, index + 1);
  const conflict = pick(profile.conflicts, index + 2);
  const stakes = pick(profile.stakes, index + 3);
  const tone = pick(profile.tones, index + 4);
  const themeA = pick(profile.themes, index + 5);
  const themeB = pick(profile.themes, index + 6);
  const subjectA = pick(profile.subjects, index + 7);
  const subjectB = pick(profile.subjects, index + 8);

  return [
    `This ${profile.genre.toLowerCase()} ${profile.bookType} by ${author} is intentionally written as a ${tone} story for readers who want clear genre signals and rich keyword detail.`,
    `${title} follows a ${protagonist} working inside a ${setting}, where ${conflict} forces every decision into sharper focus.`,
    `As the narrative escalates, the book examines ${themeA} and ${themeB} through concrete scenes tied to ${subjectA} and ${subjectB}, making the story easy to match against reader interests in retrieval.`,
    'The plot structure blends personal stakes with wider consequences, so the emotional arc and the external conflict develop in parallel instead of feeling disconnected.',
    `By the final act, the central question becomes whether the characters can prevent ${stakes} without sacrificing the values that defined them at the start.`,
  ].join(' ');
};

const buildDescription = (profile, synopsis) => {
  const firstSentence = synopsis.split('. ')[0] || synopsis;
  return `${firstSentence}. Genre: ${profile.genre}. Type: ${profile.bookType}.`;
};

const buildPublishedDate = (index) => {
  const year = 2016 + (index % 10);
  const month = (index % 12) + 1;
  const day = ((index * 7) % 27) + 1;
  return new Date(Date.UTC(year, month - 1, day));
};

const buildBook = (profile, profileIndex, slotIndex, globalIndex, usedTitles) => {
  const title = buildTitle(profile, slotIndex + profileIndex, usedTitles);
  const author = buildAuthor(globalIndex);
  const synopsis = buildSynopsis(profile, globalIndex, title, author);

  return {
    title,
    author,
    description: buildDescription(profile, synopsis),
    synopsis,
    genre: profile.genre,
    tags: [...profile.tags],
    themes: [...profile.themes],
    subjects: [...profile.subjects],
    language: 'English',
    audience: profile.audience,
    publishedDate: buildPublishedDate(globalIndex),
    price: 200 + ((globalIndex * 37) % 501),
    rating: Number((3.8 + ((globalIndex * 17) % 12) / 10).toFixed(1)),
    isPublished: true,
  };
};

const createCatalog = () => {
  const usedTitles = new Set();
  const books = [];

  let globalIndex = 0;
  for (let profileIndex = 0; profileIndex < genreProfiles.length; profileIndex += 1) {
    const profile = genreProfiles[profileIndex];

    for (let slot = 0; slot < BOOKS_PER_GENRE; slot += 1) {
      books.push(buildBook(profile, profileIndex, slot, globalIndex, usedTitles));
      globalIndex += 1;
    }
  }

  return books;
};

const buildEmbeddingText = (book = {}) => {
  return [
    book.title,
    book.author,
    book.synopsis || book.description || '',
    book.genre,
    ...(Array.isArray(book.tags) ? book.tags : []),
    ...(Array.isArray(book.themes) ? book.themes : []),
    ...(Array.isArray(book.subjects) ? book.subjects : []),
  ]
    .filter(Boolean)
    .join(' ');
};

const embedAndSyncBooks = async (books) => {
  let embedded = 0;
  let syncFailures = 0;
  let loggedSyncErrors = 0;

  for (let index = 0; index < books.length; index += 1) {
    const book = books[index];

    const embedding = await embeddingService.embedText(buildEmbeddingText(book));
    const updated = await Book.findByIdAndUpdate(
      book._id,
      {
        embedding,
        semanticMetadata: {
          embeddedAt: new Date(),
          modelVersion: EMBEDDING_MODEL_VERSION,
        },
      },
      { returnDocument: 'after' }
    );

    if (updated?.embedding?.length) {
      embedded += 1;

      if (isQdrantEnabled()) {
        try {
          await upsertBookPoint(updated);
        } catch (error) {
          syncFailures += 1;
          if (loggedSyncErrors < 3) {
            console.warn(`Qdrant sync failed for "${updated.title}": ${error.message}`);
            loggedSyncErrors += 1;
          }
        }
      }
    }

    if ((index + 1) % 10 === 0 || index === books.length - 1) {
      console.log(`Embedding progress: ${index + 1}/${books.length}`);
    }
  }

  return { embedded, syncFailures };
};

const run = async () => {
  try {
    await mongoose.connect(mongoDBURL);
    console.log('Connected to MongoDB');

    const freshCatalog = createCatalog();
    console.log(`Prepared synthetic catalog: ${freshCatalog.length} books`);

    if (isQdrantEnabled()) {
      await resetQdrantCollection();
      console.log('Qdrant collection reset complete');
    } else {
      console.log('Qdrant disabled, skipping collection reset');
    }

    const removeResult = await Book.deleteMany({});
    console.log(`Deleted previous books: ${removeResult.deletedCount}`);

    const inserted = await Book.insertMany(freshCatalog, { ordered: true });
    console.log(`Inserted new books: ${inserted.length}`);

    const shouldSkipEmbedding = String(process.env.SKIP_EMBEDDINGS || '').trim() === '1';
    if (shouldSkipEmbedding) {
      console.log('Skipping embedding and vector sync because SKIP_EMBEDDINGS=1');
      return;
    }

    const { embedded, syncFailures } = await embedAndSyncBooks(inserted);
    console.log(`Embedded books: ${embedded}`);
    console.log(`Qdrant sync failures: ${syncFailures}`);

    const withEmbeddings = await Book.countDocuments({ embedding: { $exists: true, $ne: null } });
    console.log(`Books with embeddings: ${withEmbeddings}`);
  } catch (error) {
    console.error(`Catalog rebuild failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run();