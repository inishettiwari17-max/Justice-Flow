const mongoose = require('mongoose');

const advocateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  enrollmentNumber: { type: String, required: true, unique: true, trim: true },
  yearsOfExperience: { type: Number, default: 0, min: 0 },
  specialties: [{ type: String, trim: true }],
  courtPracticeAreas: [{ type: String, trim: true }],
  languages: [{ type: String, trim: true }],
  consultationFee: { type: Number, default: 0 },
  availability: {
    isAvailable: { type: Boolean, default: true },
    schedule: { type: String, default: '' },
    offDays: [{ type: String }]
  },
  bio: { type: String, default: '', maxlength: 2000 },
  education: [{
    degree: { type: String },
    institution: { type: String },
    year: { type: Number }
  }],
  caseHistory: [{
    title: { type: String },
    description: { type: String },
    outcome: { type: String },
    year: { type: Number }
  }],
  documents: [{
    name: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationNote: { type: String, default: '' },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isVerifiedBadge: { type: Boolean, default: false },
  profileViews: { type: Number, default: 0 },
  totalConsultations: { type: Number, default: 0 }
}, { timestamps: true });

// Index for search performance
advocateSchema.index({ specialties: 1, 'user.location': 1, averageRating: -1 });
advocateSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Advocate', advocateSchema);
