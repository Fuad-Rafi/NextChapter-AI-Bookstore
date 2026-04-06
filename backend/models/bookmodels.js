import mongoose from "mongoose";

const stringArray = {
  type: [String],
  default: [],
};

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: { 
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  synopsis: {
    type: String,
    default: '',
    trim: true,
  },
  genre: {
    type: String,
    default: '',
    trim: true,
  },
  tags: stringArray,
  themes: stringArray,
  subjects: stringArray,
  language: {
    type: String,
    default: '',
    trim: true,
  },
  audience: {
    type: String,
    default: '',
    trim: true,
  },
  searchText: {
    type: String,
    default: '',
    index: true,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  publishedDate: {
    type: Date,
    required: true,
  },
  coverImage: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    default: null,
    min: 200,
    max: 700,
  },
  rating: {
    type: Number,
    default: null,
    min: 0,
    max: 5,
  },
  embedding: {
    type: [Number],
    required: false,
    sparse: true,
  },
  semanticMetadata: {
    embeddedAt: {
      type: Date,
      required: false,
    },
    modelVersion: {
      type: String,
      required: false,
    },
  },
}, { timestamps: true });

bookSchema.pre('validate', function updateSearchText() {
  const parts = [
    this.title,
    this.author,
    this.description,
    this.synopsis,
    this.genre,
    ...(Array.isArray(this.tags) ? this.tags : []),
    ...(Array.isArray(this.themes) ? this.themes : []),
    ...(Array.isArray(this.subjects) ? this.subjects : []),
    this.language,
    this.audience,
  ];

  this.searchText = parts
    .filter(Boolean)
    .map((part) => String(part).trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
});

const Book = mongoose.model("Book", bookSchema);

export default Book;