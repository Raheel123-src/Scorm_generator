const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['welcome', 'accordion', 'checklist', 'text-image', 'document', 'video', 'flashcards', 'quiz', 'hotspot', 'embed', 'course-completed']
  },
  title: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  order: {
    type: Number,
    required: true
  }
});

const scormPackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: [contentBlockSchema],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
scormPackageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SCORMPackage', scormPackageSchema);
