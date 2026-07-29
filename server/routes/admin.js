const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Advocate = require('../models/Advocate');
const Review = require('../models/Review');
const Consultation = require('../models/Consultation');
const Message = require('../models/Message');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// GET /api/admin/stats — platform analytics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, totalAdvocates, totalReviews,
      pendingVerifications, totalConsultations,
      flaggedReviews, bannedUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'advocate' }),
      Review.countDocuments(),
      Advocate.countDocuments({ verificationStatus: 'pending' }),
      Consultation.countDocuments(),
      Review.countDocuments({ isFlagged: true }),
      User.countDocuments({ isBanned: true })
    ]);

    // Monthly signups (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalAdvocates, totalReviews,
        pendingVerifications, totalConsultations,
        flaggedReviews, bannedUsers, monthlySignups
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/users/:id/ban — ban or unban a user
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot ban an admin' });

    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ success: true, message: `User ${user.isBanned ? 'banned' : 'unbanned'}`, isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/advocates — list advocates with verification status
router.get('/advocates', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Advocate.countDocuments(filter);
    const advocates = await Advocate.find(filter)
      .populate('user', 'name email photo phone location createdAt')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: advocates, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/advocates/:id/verify — approve or reject advocate
router.put('/advocates/:id/verify', async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const advocate = await Advocate.findById(req.params.id).populate('user', 'name email');
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

    advocate.verificationStatus = status;
    advocate.verificationNote = note || '';
    advocate.isVerifiedBadge = status === 'approved';
    await advocate.save();

    res.json({ success: true, data: advocate, message: `Advocate ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/reviews — all reviews with flagged ones
router.get('/reviews', async (req, res) => {
  try {
    const { flagged, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (flagged === 'true') filter.isFlagged = true;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('user', 'name email photo')
      .populate({ path: 'advocate', populate: { path: 'user', select: 'name' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/reviews/:id — approve, reject, or unflag a review
router.put('/reviews/:id', async (req, res) => {
  try {
    const { isApproved, isFlagged, adminNote } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (isApproved !== undefined) review.isApproved = isApproved;
    if (isFlagged !== undefined) review.isFlagged = isFlagged;
    if (adminNote) review.adminNote = adminNote;

    await review.save();
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/reviews/:id — permanently delete a review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
