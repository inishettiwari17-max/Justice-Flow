const express = require('express');
const router = express.Router();
const Advocate = require('../models/Advocate');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfile, uploadDocument } = require('../middleware/upload');
const path = require('path');

// GET /api/advocates — search + filter advocates
router.get('/', async (req, res) => {
  try {
    const {
      search, specialty, minExp, maxExp, minRating, language,
      city, state, minFee, maxFee, available, sort, page = 1, limit = 12
    } = req.query;

    // Build match pipeline on User first, then join Advocate
    const advocateFilter = { verificationStatus: 'approved' };
    const userFilter = { role: 'advocate', isActive: true, isBanned: false };

    if (specialty) advocateFilter.specialties = { $in: [new RegExp(specialty, 'i')] };
    if (minExp) advocateFilter.yearsOfExperience = { ...advocateFilter.yearsOfExperience, $gte: Number(minExp) };
    if (maxExp) advocateFilter.yearsOfExperience = { ...advocateFilter.yearsOfExperience, $lte: Number(maxExp) };
    if (minRating) advocateFilter.averageRating = { $gte: Number(minRating) };
    if (language) advocateFilter.languages = { $in: [new RegExp(language, 'i')] };
    if (minFee) advocateFilter.consultationFee = { ...advocateFilter.consultationFee, $gte: Number(minFee) };
    if (maxFee) advocateFilter.consultationFee = { ...advocateFilter.consultationFee, $lte: Number(maxFee) };
    if (available === 'true') advocateFilter['availability.isAvailable'] = true;
    if (city) userFilter['location.city'] = new RegExp(city, 'i');
    if (state) userFilter['location.state'] = new RegExp(state, 'i');

    if (search) {
      userFilter.$or = [
        { name: new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') }
      ];
      advocateFilter.$or = advocateFilter.$or || [];
      // We'll also check specialties
    }

    // Sort
    let sortObj = { averageRating: -1 };
    if (sort === 'experience') sortObj = { yearsOfExperience: -1 };
    if (sort === 'fee_asc') sortObj = { consultationFee: 1 };
    if (sort === 'fee_desc') sortObj = { consultationFee: -1 };
    if (sort === 'reviews') sortObj = { totalReviews: -1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    // Get matching users first
    const matchingUsers = await User.find(userFilter).select('_id name photo location preferredLanguage');
    const userIds = matchingUsers.map(u => u._id);
    advocateFilter.user = { $in: userIds };

    const total = await Advocate.countDocuments(advocateFilter);
    const advocates = await Advocate.find(advocateFilter)
      .populate('user', 'name photo location preferredLanguage email phone')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: advocates,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/advocates/:id — single advocate profile
router.get('/:id', async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.params.id)
      .populate('user', 'name photo location email phone preferredLanguage createdAt');

    if (!advocate) {
      return res.status(404).json({ success: false, message: 'Advocate not found' });
    }

    // Increment profile views
    advocate.profileViews += 1;
    await advocate.save();

    const reviews = await Review.find({ advocate: advocate._id, isApproved: true })
      .populate('user', 'name photo')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: advocate, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/advocates/profile — advocate updates their own profile
router.put('/profile', protect, authorize('advocate'), async (req, res) => {
  try {
    const {
      enrollmentNumber, yearsOfExperience, specialties, courtPracticeAreas,
      languages, consultationFee, availability, bio, education, caseHistory
    } = req.body;

    const advocate = await Advocate.findOne({ user: req.user._id });
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate profile not found' });

    if (enrollmentNumber) advocate.enrollmentNumber = enrollmentNumber;
    if (yearsOfExperience !== undefined) advocate.yearsOfExperience = yearsOfExperience;
    if (specialties) advocate.specialties = specialties;
    if (courtPracticeAreas) advocate.courtPracticeAreas = courtPracticeAreas;
    if (languages) advocate.languages = languages;
    if (consultationFee !== undefined) advocate.consultationFee = consultationFee;
    if (availability) advocate.availability = { ...advocate.availability, ...availability };
    if (bio) advocate.bio = bio;
    if (education) advocate.education = education;
    if (caseHistory) advocate.caseHistory = caseHistory;

    await advocate.save();
    res.json({ success: true, data: advocate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/advocates/upload-document — upload verification doc
router.post(
  '/upload-document',
  protect,
  authorize('advocate'),
  uploadDocument.single('document'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      const advocate = await Advocate.findOne({ user: req.user._id });
      if (!advocate) return res.status(404).json({ success: false, message: 'Advocate profile not found' });

      const fileUrl = `/uploads/documents/${req.file.filename}`;
      advocate.documents.push({
        name: req.body.docName || req.file.originalname,
        url: fileUrl
      });
      await advocate.save();

      res.json({ success: true, message: 'Document uploaded', url: fileUrl });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// GET /api/advocates/my/profile — advocate's own full profile
router.get('/my/profile', protect, authorize('advocate'), async (req, res) => {
  try {
    const advocate = await Advocate.findOne({ user: req.user._id })
      .populate('user', 'name email photo phone location preferredLanguage');
    if (!advocate) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: advocate });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/advocates/specialties/list — distinct specialties for filter
router.get('/specialties/list', async (req, res) => {
  try {
    const specialties = await Advocate.distinct('specialties', { verificationStatus: 'approved' });
    res.json({ success: true, data: specialties.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
