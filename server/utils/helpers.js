// Financial Year Helper - FIXED TO MATCH ANDROID
function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Convert to 1-based month
  
  // April to March cycle (same as Android)
  return month >= 4 ? year + 1 : year;
}

// Get financial year date range
function getFinancialYearRange(year = null) {
  const fy = year || getFinancialYear();
  return {
    start: new Date(fy - 1, 3, 1), // April 1st
    end: new Date(fy, 2, 31), // March 31st
    year: fy
  };
}

// Format date for display
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    default:
      return d.toISOString();
  }
}

// Validate entry data (for Firestore)
function validateEntryData(data) {
  const errors = [];
  
  if (!data.particulars || data.particulars.trim().length === 0) {
    errors.push('particulars is required');
  }

  if (!data.capacityMw || data.capacityMw <= 0) {
    errors.push('capacityMw must be a positive number');
  }

  if (!data.clientCode || data.clientCode.trim().length < 2 || data.clientCode.trim().length > 4) {
    errors.push('clientCode must be between 2 and 4 characters');
  }

  if (!data.siteName || data.siteName.trim().length < 2 || data.siteName.trim().length > 4) {
    errors.push('siteName must be between 2 and 4 characters');
  }

  if (!data.stateName || data.stateName.trim().length < 2 || data.stateName.trim().length > 4) {
    errors.push('stateName must be between 2 and 4 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate reference code - FIXED TO MATCH ANDROID LOGIC
function generateReferenceCode(entryData, cumulativeCount, incrementalCount) {
  const {
    particulars,
    clientCode,
    capacityMw,
    siteName,
    stateName
  } = entryData;
  
  // Get current financial year (2-digit format like Android)
  const currentFY = getFinancialYear() % 100;
  
  // Format: FY + cumulative count (e.g., 26321 = FY26 + 321 total entries)
  const fyWithCumulative = `${currentFY.toString().padStart(2, '0')}${cumulativeCount.toString().padStart(3, '0')}`;
  
  // Format incremental count (e.g., 05 = 5th entry in current FY)
  const incrementalFormatted = incrementalCount.toString().padStart(2, '0');
  
  return `IPR/${(particulars || '').toUpperCase()}/${(clientCode || '').toUpperCase().slice(0, 4)}/${capacityMw}MW/${(stateName || '').toUpperCase()}/${(siteName || '').toUpperCase()}/${fyWithCumulative}/${incrementalFormatted}`;
}

// Sanitize input data
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .substring(0, 100); // Limit length
}

// Check if user has permission to modify entry
function canUserModifyEntry(user, entry) {
  // For Firebase, user.uid is the unique identifier
  return user.role === 'admin' || entry.createdBy === user.uid;
}

// Generate pagination metadata
function getPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
}

// Calculate statistics
function calculateStats(entries) {
  if (!entries || entries.length === 0) {
    return {
      total: 0,
      averageCapacity: 0,
      totalCapacity: 0,
      byParticulars: {},
      byClient: {},
      byMonth: {}
    };
  }
  
  const totalCapacity = entries.reduce((sum, entry) => sum + (entry.capacityMw || 0), 0);
  const averageCapacity = totalCapacity / entries.length;
  
  const byParticulars = entries.reduce((acc, entry) => {
    acc[entry.particulars] = (acc[entry.particulars] || 0) + 1;
    return acc;
  }, {});
  
  const byClient = entries.reduce((acc, entry) => {
    acc[entry.clientCode] = (acc[entry.clientCode] || 0) + 1;
    return acc;
  }, {});
  
  const byMonth = entries.reduce((acc, entry) => {
    const date = entry.createdAt?.seconds
      ? new Date(entry.createdAt.seconds * 1000)
      : new Date(entry.createdAt);
    const month = date.toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: entries.length,
    averageCapacity: Math.round(averageCapacity * 100) / 100,
    totalCapacity,
    byParticulars,
    byClient,
    byMonth
  };
}

// Error response helper
function createErrorResponse(message, status = 500, details = null) {
  const error = {
    error: message,
    timestamp: new Date().toISOString(),
    status
  };
  
  if (details) {
    error.details = details;
  }
  
  return error;
}

// Success response helper
function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getFinancialYear,
  getFinancialYearRange,
  formatDate,
  validateEntryData,
  generateReferenceCode,
  sanitizeInput,
  canUserModifyEntry,
  getPaginationMeta,
  calculateStats,
  createErrorResponse,
  createSuccessResponse
};