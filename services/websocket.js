const { authenticateSocket } = require('../middleware/auth');

const initializeWebSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
      const User = require('../models/User');
      const user = await User.findById(decoded.userId).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Invalid user'));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socket.join(`user-${socket.userId}`);

    // Handle real-time updates
    socket.on('subscribe:dashboard', () => {
      socket.join(`dashboard-${socket.userId}`);
    });

    socket.on('subscribe:orders', () => {
      socket.join(`orders-${socket.userId}`);
    });

    socket.on('subscribe:inventory', () => {
      socket.join(`inventory-${socket.userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.leave(`user-${socket.userId}`);
    });
  });

  return io;
};

module.exports = { initializeWebSocket };
