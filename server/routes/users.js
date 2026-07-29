const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Advocate = require('../models/Advocate');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

// PUT /api/users/profile — update own profile
router.put('/profile', protect, uploadProfile.single('photo'), async (req, res) => {
  try {
    const { name, phone, city, state, country, preferredLanguage, caseType, requirements } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (caseType) user.caseType = caseType;
    if (requirements) user.requirements = requirements;
    if (city || state || country) {
      user.location = {
        city: city || user.location.city,
        state: state || user.location.state,
        country: country || user.location.country
      };
    }
    if (req.file) {
      user.photo = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/users/save-advocate/:advocateId
router.post('/save-advocate/:advocateId', protect, authorize('user'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const advocateId = req.params.advocateId;

    const index = user.savedAdvocates.indexOf(advocateId);
    let message;
    if (index === -1) {
      user.savedAdvocates.push(advocateId);
      message = 'Advocate saved';
    } else {
      user.savedAdvocates.splice(index, 1);
      message = 'Advocate removed from saved';
    }
    await user.save();
    res.json({ success: true, message, savedAdvocates: user.savedAdvocates });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/saved-advocates
router.get('/saved-advocates', protect, authorize('user'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedAdvocates',
      populate: { path: 'user', select: 'name photo location' }
    });
    res.json({ success: true, data: user.savedAdvocates });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/profile — get own profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
