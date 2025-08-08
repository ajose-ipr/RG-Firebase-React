// Dictionary mapping for PARTICULARS
export const PARTICULARS_MAPPING = {
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
export const CLIENT_CODE_MAPPING = {
  'HFEX': 'Haryana Electricity Exchange',
  'ADN': 'Adani Power',
  'HEXA': 'Hexagon Energy',
  'GE': 'General Electric'
};

// Dictionary mapping for SITE_NAME
export const SITE_NAME_MAPPING = {
  'SJPR': 'SARJAPUR',
  'BNSK': 'BANSHANKARI',
  'GRID': 'Grid Station'
};

// Helper function to get full form of particulars
export const getParticularsFullForm = (particularsCode) => {
  if (!particularsCode) return '';
  return PARTICULARS_MAPPING[particularsCode] || particularsCode;
};

// Helper function to get full form of client code
export const getClientCodeFullForm = (clientCode) => {
  if (!clientCode) return '';
  return CLIENT_CODE_MAPPING[clientCode] || clientCode;
};

// Helper function to get full form of site name
export const getSiteNameFullForm = (siteName) => {
  if (!siteName) return '';
  return SITE_NAME_MAPPING[siteName] || siteName;
};

// Default dropdown codes for use in forms
export const DEFAULT_DROPDOWN_OPTIONS = {
  PARTICULARS: [
    { value: 'TC', displayName: 'Type Check' },
    { value: 'GC', displayName: 'Grid Connection' },
    { value: 'PQM', displayName: 'Power Quality Monitor' },
    { value: 'EVF', displayName: 'Emergency Verification' },
    { value: 'OPT', displayName: 'Optimization' }
  ],
  CLIENT_CODE: [
    { value: 'HFEX', displayName: 'Haryana Electricity Exchange' },
    { value: 'ADN', displayName: 'Adani Power' },
    { value: 'HEXA', displayName: 'Hexagon Energy' },
    { value: 'GE', displayName: 'General Electric' }
  ],
  SITE_NAME: [
    { value: 'SJPR', displayName: 'SARJAPUR' },
    { value: 'BNSK', displayName: 'BANSHANKARI' },
    { value: 'GRID', displayName: 'Grid Station' }
  ],
  STATE_NAME: [
    { value: 'KA', displayName: 'Karnataka' },
    { value: 'TN', displayName: 'Tamil Nadu' },
    { value: 'AP', displayName: 'Andhra Pradesh' },
    { value: 'TS', displayName: 'Telangana' }
  ]
};