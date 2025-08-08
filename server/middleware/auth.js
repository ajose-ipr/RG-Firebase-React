const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Basic token authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  
  next();
};

// Check if user can modify entry (admin or owner)
const canModifyEntry = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get entry to check ownership
    const Entry = require('../models/Entry');
    const entry = await Entry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Admin can modify any entry
    if (req.user.role === 'admin') {
      req.entry = entry; // Attach entry to request for use in route
      return next();
    }

    // Check if user is the creator
    if (entry.CREATED_BY !== req.user.username) {
      return res.status(403).json({ error: 'You can only modify your own entries' });
    }

    req.entry = entry; // Attach entry to request for use in route
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Rate limiting middleware (basic implementation)
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    const clientRequests = requests.get(clientId) || [];
    const recentRequests = clientRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    recentRequests.push(now);
    requests.set(clientId, recentRequests);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  canModifyEntry,
  rateLimiter
};