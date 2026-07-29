const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const Advocate = require('../models/Advocate');
const { protect, authorize } = require('../middleware/auth');

// POST /api/consultations — request a consultation
router.post('/', protect, authorize('user'), async (req, res) => {
  try {
    const { advocateId, caseType, description, preferredDate } = req.body;

    const advocate = await Advocate.findById(advocateId);
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

    const consultation = await Consultation.create({
      user: req.user._id,
      advocate: advocateId,
      caseType,
      description,
      preferredDate,
      fee: advocate.consultationFee
    });

    await consultation.populate('advocate');
    await consultation.populate('user', 'name email phone');
    res.status(201).json({ success: true, data: consultation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/consultations/my — user's own consultations
router.get('/my', protect, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'user') {
      query = Consultation.find({ user: req.user._id });
    } else if (req.user.role === 'advocate') {
      const advocate = await Advocate.findOne({ user: req.user._id });
      if (!advocate) return res.status(404).json({ success: false, message: 'Profile not found' });
      query = Consultation.find({ advocate: advocate._id });
    }

    const consultations = await query
      .populate('user', 'name email phone photo')
      .populate({ path: 'advocate', populate: { path: 'user', select: 'name photo' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: consultations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/consultations/:id/status — advocate accepts/rejects
router.put('/:id/status', protect, authorize('advocate'), async (req, res) => {
  try {
    const { status, advocateNote } = req.body;
    const advocate = await Advocate.findOne({ user: req.user._id });
    const consultation = await Consultation.findOne({ _id: req.params.id, advocate: advocate._id });

    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });

    consultation.status = status;
    if (advocateNote) consultation.advocateNote = advocateNote;

    if (status === 'completed') {
      advocate.totalConsultations += 1;
      await advocate.save();
    }

    await consultation.save();
    res.json({ success: true, data: consultation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/consultations/:id — user cancels
router.delete('/:id', protect, authorize('user'), async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ _id: req.params.id, user: req.user._id });
    if (!consultation) return res.status(404).json({ success: false, message: 'Not found' });
    if (consultation.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a non-pending consultation' });
    }
    consultation.status = 'cancelled';
    await consultation.save();
    res.json({ success: true, message: 'Consultation cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
