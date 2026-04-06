import mongoose from 'mongoose';

const stringArray = {
  type: [String],
  default: [],
};

const readingPreferencesSchema = new mongoose.Schema(
  {
    preferredGenres: stringArray,
    dislikedGenres: stringArray,
    preferredAuthors: stringArray,
    favoriteAuthors: stringArray,
    favoriteThemes: stringArray,
    tonePreferences: stringArray,
    readingGoals: stringArray,
    preferredLanguage: {
      type: String,
      default: '',
      trim: true,
    },
    budgetRange: {
      min: {
        type: Number,
        default: null,
      },
      max: {
        type: Number,
        default: null,
      },
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const assistantMemorySchema = new mongoose.Schema(
  {
    chatSummary: {
      type: String,
      default: '',
      trim: true,
    },
    lastConversationAt: {
      type: Date,
      default: null,
    },
    lastUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const feedbackProfileSchema = new mongoose.Schema(
  {
    likedBookIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Book',
      default: [],
    },
    dislikedBookIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Book',
      default: [],
    },
    clickedBookIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Book',
      default: [],
    },
    viewedBookIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Book',
      default: [],
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer'],
      default: 'customer',
    },
    preferences: {
      type: readingPreferencesSchema,
      default: () => ({}),
    },
    assistantMemory: {
      type: assistantMemorySchema,
      default: () => ({}),
    },
    feedbackProfile: {
      type: feedbackProfileSchema,
      default: () => ({}),
    },
    profileNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;