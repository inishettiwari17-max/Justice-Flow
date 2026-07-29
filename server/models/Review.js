const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  advocate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocate',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: { type: String, trim: true, maxlength: 100 },
  comment: { type: String, trim: true, maxlength: 1000 },
  isVerified: { type: Boolean, default: true }, // user must be registered to review
  isApproved: { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String, default: '' },
  adminNote: { type: String, default: '' }
}, { timestamps: true });

// One review per user per advocate
reviewSchema.index({ advocate: 1, user: 1 }, { unique: true });

// After save, recalculate advocate's average rating
reviewSchema.post('save', async function () {
  const Advocate = mongoose.model('Advocate');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { advocate: this.advocate, isApproved: true } },
    { $group: { _id: '$advocate', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  if (stats.length > 0) {
    await Advocate.findByIdAndUpdate(this.advocate, {
      averageRating: Math.round(stats[0].avg * 10) / 10,
      totalReviews: stats[0].count
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
