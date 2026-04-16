import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
  },
  { _id: false }
);

const conversationMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    retrievedBookIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Book',
      default: [],
    },
    feedback: {
      type: feedbackSchema,
      default: () => ({}),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    messages: {
      type: [conversationMessageSchema],
      default: [],
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

const ChatMemory = mongoose.model('ChatMemory', chatMemorySchema);

export default ChatMemory;
