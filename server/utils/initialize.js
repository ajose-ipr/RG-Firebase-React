const User = require('../models/User');
const DropdownOption = require('../models/DropdownOption');

// Dictionary mapping for PARTICULARS
const PARTICULARS_MAPPING = {
  'TC': 'Type Check',
  'GC': 'Grid Connection',
  'PQM': 'Power Quality Monitor',
  'EVF': 'Emergency Verification',
  'OPT': 'Optimization',
  'PS': 'Power System',
  'SS': 'Substation',
  'Others': 'Others (Custom)'
};

// Dictionary mapping for CLIENT_CODE
const CLIENT_CODE_MAPPING = {
  'HFEX': 'Haryana Electricity Exchange',
  'ADN': 'Adani Power',
  'HEXA': 'Hexagon Energy',
  'GE': 'General Electric'
};

// Dictionary mapping for SITE_NAME
const SITE_NAME_MAPPING = {
  'SJPR': 'Sarjapur',
  'BNSK': 'Banashankari',
  'GRID': 'Grid Station',
  'SUBJ': 'Subject Location'
};

// Dictionary mapping for SITE_NAME
const STATE_NAME_MAPPING = {
  'KA': 'KARNATAKA',
  'GJ': 'GUJARAT',
  'MH': 'MAHARASHTRA',
  'TN': 'TAMIL NADU',
  'AP': 'ANDHRA PRADESH',
  'TS': 'TELANGANA',
  'RJ': 'RAJASTHAN',
};

// Initialize default data
async function initializeDefaults() {
  try {
    console.log('🔄 Initializing default data...');
    
    await createDefaultAdmin();
    await createDefaultDropdownOptions();
    
    console.log('✨ Application ready!');
  } catch (error) {
    console.error('❌ Error initializing defaults:', error);
  }
}

// Create default admin user
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123', // Let the User model handle hashing
        role: 'admin'
      });
      console.log('👤 Admin user created (username: admin, password: admin123)');
      console.log('⚠️  Please change the default admin password immediately!');
    } else {
      // Reset admin password to fix any double-hashing issues
      const admin = await User.findOne({ username: 'admin' });
      admin.password = 'admin123'; // This will be hashed by the pre-save hook
      await admin.save();
      console.log('👤 Admin user exists - password reset to: admin123');
      console.log('⚠️  Please change the default admin password immediately!');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Create default dropdown options
async function createDefaultDropdownOptions() {
  try {
    // Create PARTICULARS options with display names
    for (const [value, displayName] of Object.entries(PARTICULARS_MAPPING)) {
      await DropdownOption.findOneAndUpdate(
        { type: 'PARTICULARS', value: value },
        { 
          type: 'PARTICULARS', 
          value: value,
          displayName: displayName,
          isCustom: false, 
          createdBy: 'system',
          isActive: true
        },
        { upsert: true }
      );
    }
    
    // Create CLIENT_CODE options with display names
    for (const [value, displayName] of Object.entries(CLIENT_CODE_MAPPING)) {
      await DropdownOption.findOneAndUpdate(
        { type: 'CLIENT_CODE', value: value },
        { 
          type: 'CLIENT_CODE', 
          value: value,
          displayName: displayName,
          isCustom: false, 
          createdBy: 'system',
          isActive: true
        },
        { upsert: true }
      );
    }

    // Create SITE_NAME options with display names
    for (const [value, displayName] of Object.entries(STATE_NAME_MAPPING)) {
      await DropdownOption.findOneAndUpdate(
        { type: 'STATE_NAME', value: value },
        { 
          type: 'STATE_NAME', 
          value: value,
          displayName: displayName,
          isCustom: false, 
          createdBy: 'system',
          isActive: true
        },
        { upsert: true }
      );
    }

    // Create SITE_NAME options with display names
    for (const [value, displayName] of Object.entries(SITE_NAME_MAPPING)) {
      await DropdownOption.findOneAndUpdate(
        { type: 'SITE_NAME', value: value },
        { 
          type: 'SITE_NAME', 
          value: value,
          displayName: displayName,
          isCustom: false, 
          createdBy: 'system',
          isActive: true
        },
        { upsert: true }
      );
    }
    
   console.log('📋 Dropdown options initialized with display names');
    console.log(`   - PARTICULARS: ${Object.keys(PARTICULARS_MAPPING).join(', ')}`);
    console.log(`   - CLIENT_CODE: ${Object.keys(CLIENT_CODE_MAPPING).join(', ')}`);
    console.log(`   - SITE_NAME: ${Object.keys(SITE_NAME_MAPPING).join(', ')}`);
     console.log(`   - STATE_NAME: ${Object.keys(STATE_NAME_MAPPING).join(', ')}`);
  } catch (error) {
    console.error('❌ Error creating dropdown options:', error);
  }
}

// Create sample entries (for testing)
async function createSampleEntries() {
  try {
    const Entry = require('../models/Entry');
    const AuditLog = require('../models/AuditLog');
    const { getFinancialYear } = require('./helpers');
    
    const entryCount = await Entry.countDocuments();
    if (entryCount > 0) {
      console.log('📝 Sample entries already exist, skipping creation');
      return;
    }
    
    console.log('🔄 Creating sample entries...');
    
    const sampleData = [
      {
        PARTICULARS: 'TC',
        CLIENT_CODE: 'HFEX',
        CAPACITY_MW: 100,
        STATE_NAME: 'KA',
        SITE_NAME: 'MAIN'
      },
      {
        PARTICULARS: 'GC',
        CLIENT_CODE: 'ADN',
        CAPACITY_MW: 50,
        STATE_NAME: 'GJ',
        SITE_NAME: 'GRID'
      },
      {
        PARTICULARS: 'PQM',
        CLIENT_CODE: 'HEXA',
        CAPACITY_MW: 75,
        STATE_NAME: 'MH',
        SITE_NAME: 'SUBJ'
      }
    ];
    
    for (let i = 0; i < sampleData.length; i++) {
      const data = sampleData[i];
      const currentFY = getFinancialYear();
      
      const entry = new Entry({
        SL_NO: i + 1,
        USER_NAME: 'admin',
        PARTICULARS: data.PARTICULARS,
        CLIENT_CODE: data.CLIENT_CODE,
        CAPACITY_MW: data.CAPACITY_MW,
        STATE_NAME: data.STATE_NAME,
        SITE_NAME: data.SITE_NAME,
        CUMULATIVE_NUMBER: `${currentFY.toString().slice(-2)}${i + 1}`,
        INCREMENTAL_NUMBER: i + 1,
        CREATED_BY: 'admin'
      });
      
      // Generate reference code
      entry.generateReferenceCode();
      
      await entry.save();
      
      // Create audit log
      await AuditLog.logEntryAction('CREATE', entry._id, 'admin', null, entry.toObject());
    }
    
    console.log(`📝 Created ${sampleData.length} sample entries`);
  } catch (error) {
    console.error('❌ Error creating sample entries:', error);
  }
}

// Reset database (use with caution!)
async function resetDatabase() {
  try {
    console.log('⚠️  Resetting database...');
    
    const Entry = require('../models/Entry');
    const AuditLog = require('../models/AuditLog');
    
    await Entry.deleteMany({});
    await DropdownOption.deleteMany({ isCustom: true });
    await AuditLog.deleteMany({});
    await User.deleteMany({ username: { $ne: 'admin' } });
    
    console.log('🗑️  Database reset complete');
    
    // Reinitialize defaults
    await initializeDefaults();
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
}

// Database health check
async function checkDatabaseHealth() {
  try {
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    const stats = {
      users: await User.countDocuments(),
      entries: await Entry.countDocuments(),
      dropdownOptions: await DropdownOption.countDocuments(),
      auditLogs: await AuditLog.countDocuments(),
      adminExists: !!(await User.findOne({ role: 'admin' }))
    };
    
    console.log('📊 Database Health Check:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    throw error;
  }
}

module.exports = {
  initializeDefaults,
  createDefaultAdmin,
  createDefaultDropdownOptions,
  createSampleEntries,
  resetDatabase,
  checkDatabaseHealth
};