const mongoose = require('mongoose');

const dropdownSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['PARTICULARS', 'CLIENT_CODE', 'SITE_NAME', 'STATE_NAME'],
    uppercase: true
  },
  value: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
    displayName: {
    type: String,
    required: true,
    trim: true
  },
  isCustom: { 
    type: Boolean, 
    default: false 
  },
  createdBy: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Compound index to ensure unique type-value combinations
dropdownSchema.index({ type: 1, value: 1 }, { unique: true });

// Static method to get options by type
dropdownSchema.statics.getByType = function(type) {
  return this.find({ type: type.toUpperCase(), isActive: true }).sort({ displayName: 1 });
};

// Static method to add new option
dropdownSchema.statics.addOption = async function(type, value, createdBy, isCustom = true) {
  const upperType = type.toUpperCase();
  const upperValue = value.toUpperCase();
  
  // Check if option already exists
  const existing = await this.findOne({ type: upperType, value: upperValue });
  if (existing) {
    throw new Error('Option already exists');
  }
  
  return this.create({
    type: upperType,
    value: upperValue,
    displayName: displayName || upperValue,
    isCustom,
    createdBy
  });
};

// Instance method to deactivate option
dropdownSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('DropdownOption', dropdownSchema);