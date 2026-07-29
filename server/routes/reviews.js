const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Advocate = require('../models/Advocate');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// POST /api/reviews/:advocateId — submit a review
router.post(
  '/:advocateId',
  protect,
  authorize('user'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 1000 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const advocate = await Advocate.findById(req.params.advocateId);
      if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

      const existing = await Review.findOne({ advocate: req.params.advocateId, user: req.user._id });
      if (existing) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this advocate' });
      }

      const review = await Review.create({
        advocate: req.params.advocateId,
        user: req.user._id,
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment
      });

      await review.populate('user', 'name photo');
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// GET /api/reviews/:advocateId — get reviews for an advocate
router.get('/:advocateId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await Review.countDocuments({ advocate: req.params.advocateId, isApproved: true });
    const reviews = await Review.find({ advocate: req.params.advocateId, isApproved: true })
      .populate('user', 'name photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Rating distribution
    const distribution = await Review.aggregate([
      { $match: { advocate: require('mongoose').Types.ObjectId.createFromHexString(req.params.advocateId), isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: reviews,
      distribution,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/reviews/:id — user deletes their own review
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await review.deleteOne();
    res.json({ success: true, message: 'Review removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/reviews/:id/flag — flag a review
router.post('/:id/flag', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.isFlagged = true;
    review.flagReason = req.body.reason || 'Reported by user';
    await review.save();
    res.json({ success: true, message: 'Review flagged for moderation' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
