const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
    uppercase: true
  },
  entryId: { 
    type: String, 
    required: function() {
      return ['CREATE', 'UPDATE', 'DELETE'].includes(this.action);
    }
  },
  userId: { 
    type: String, 
    required: true 
  },
  beforeData: { 
    type: Object,
    default: null
  },
  afterData: { 
    type: Object,
    default: null
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
});

// Index for efficient queries
auditSchema.index({ userId: 1, timestamp: -1 });
auditSchema.index({ entryId: 1, timestamp: -1 });
auditSchema.index({ action: 1, timestamp: -1 });

// Static method to log entry actions
auditSchema.statics.logEntryAction = function(action, entryId, userId, beforeData = null, afterData = null, req = null) {
  const logData = {
    action: action.toUpperCase(),
    entryId,
    userId,
    beforeData,
    afterData
  };
  
  if (req) {
    logData.ipAddress = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.get('User-Agent');
  }
  
  return this.create(logData);
};

// Static method to log user actions
auditSchema.statics.logUserAction = function(action, userId, req = null) {
  const logData = {
    action: action.toUpperCase(),
    userId
  };
  
  if (req) {
    logData.ipAddress = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.get('User-Agent');
  }
  
  return this.create(logData);
};

// Static method to get audit trail for entry
auditSchema.statics.getEntryAuditTrail = function(entryId) {
  return this.find({ entryId }).sort({ timestamp: -1 });
};

// Static method to get user activity
auditSchema.statics.getUserActivity = function(userId, limit = 50) {
  return this.find({ userId }).sort({ timestamp: -1 }).limit(limit);
};

module.exports = mongoose.model('AuditLog', auditSchema);