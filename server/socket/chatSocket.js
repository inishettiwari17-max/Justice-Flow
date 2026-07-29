const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Map userId -> socketId for online tracking
const onlineUsers = new Map();

module.exports = (io) => {
  // Authenticate socket connections via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    // Notify contacts this user is online
    socket.broadcast.emit('user_online', { userId });

    // Join a personal room for targeted delivery
    socket.join(`user_${userId}`);

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, text } = data;
        const conversationId = Message.getConversationId(userId, receiverId);

        const message = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId,
          text: text?.trim()
        });

        await message.populate('sender', 'name photo');
        await message.populate('receiver', 'name photo');

        const msgObj = message.toObject();

        // Send to receiver's room
        io.to(`user_${receiverId}`).emit('receive_message', msgObj);
        // Send back to sender (for multi-device)
        socket.emit('message_sent', msgObj);

        // Notification ping
        io.to(`user_${receiverId}`).emit('new_notification', {
          type: 'message',
          from: socket.user.name,
          preview: text?.slice(0, 60)
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit('partner_typing', { senderId: userId });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit('partner_stop_typing', { senderId: userId });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ senderId }) => {
      try {
        const conversationId = Message.getConversationId(userId, senderId);
        await Message.updateMany(
          { conversationId, receiver: userId, isRead: false },
          { isRead: true }
        );
        io.to(`user_${senderId}`).emit('messages_read', { by: userId });
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    // Get online status of specific users
    socket.on('check_online', ({ userIds }) => {
      const statuses = {};
      userIds.forEach((id) => {
        statuses[id] = onlineUsers.has(id);
      });
      socket.emit('online_statuses', statuses);
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user_offline', { userId });
    });
  });
};
