const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { uploadChatFile } = require('../middleware/upload');

// GET /api/chat/conversations — list all conversations for current user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get the latest message per conversation
    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }], isDeleted: false } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    // Populate partner info
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const msg = conv.lastMessage;
        const partnerId = msg.sender.toString() === userId.toString() ? msg.receiver : msg.sender;
        const partner = await User.findById(partnerId).select('name photo role');
        return { ...conv, partner };
      })
    );

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chat/:userId — get messages with a specific user
router.get('/:userId', protect, async (req, res) => {
  try {
    const conversationId = Message.getConversationId(req.user._id, req.params.userId);
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({ conversationId, isDeleted: false })
      .populate('sender', 'name photo')
      .populate('receiver', 'name photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, data: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/chat/:userId — send a message (REST fallback)
router.post('/:userId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const conversationId = Message.getConversationId(req.user._id, req.params.userId);

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: req.params.userId,
      text
    });

    await message.populate('sender', 'name photo');
    await message.populate('receiver', 'name photo');
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/chat/:userId/file — upload a file in chat
router.post(
  '/:userId/file',
  protect,
  uploadChatFile.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      const conversationId = Message.getConversationId(req.user._id, req.params.userId);
      const fileUrl = `/uploads/chat/${req.file.filename}`;

      const message = await Message.create({
        conversationId,
        sender: req.user._id,
        receiver: req.params.userId,
        text: '',
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype
      });

      await message.populate('sender', 'name photo');
      res.json({ success: true, data: message });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// DELETE /api/chat/message/:id
router.delete('/message/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    message.isDeleted = true;
    message.text = 'This message was deleted';
    await message.save();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
