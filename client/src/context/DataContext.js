import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../utils/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  getDocs,
  setDoc
} from 'firebase/firestore';

const DataContext = createContext();

// Default dropdown options to match Android app exactly
const DEFAULT_DROPDOWN_OPTIONS = [
  // Particulars
  { type: 'PARTICULARS', value: 'TC', displayName: 'Type Check', isActive: true, isCustom: false },
  { type: 'PARTICULARS', value: 'GC', displayName: 'Grid Connection', isActive: true, isCustom: false },
  { type: 'PARTICULARS', value: 'PQM', displayName: 'Power Quality Monitor', isActive: true, isCustom: false },
  { type: 'PARTICULARS', value: 'EVF', displayName: 'Emergency Verification', isActive: true, isCustom: false },
  { type: 'PARTICULARS', value: 'OPT', displayName: 'Optimization', isActive: true, isCustom: false },

  // Client Codes
  { type: 'CLIENT_CODE', value: 'HFEX', displayName: 'Haryana Electricity Exchange', isActive: true, isCustom: false },
  { type: 'CLIENT_CODE', value: 'ADN', displayName: 'Adani Power', isActive: true, isCustom: false },
  { type: 'CLIENT_CODE', value: 'HEXA', displayName: 'Hexagon Energy', isActive: true, isCustom: false },
  { type: 'CLIENT_CODE', value: 'GE', displayName: 'General Electric', isActive: true, isCustom: false },

  // Site Names
  { type: 'SITE_NAME', value: 'SJPR', displayName: 'SARJAPUR', isActive: true, isCustom: false },
  { type: 'SITE_NAME', value: 'BNSK', displayName: 'BANSHANKARI', isActive: true, isCustom: false },
  { type: 'SITE_NAME', value: 'GRID', displayName: 'Grid Station', isActive: true, isCustom: false },

  // State Names
  { type: 'STATE_NAME', value: 'KA', displayName: 'Karnataka', isActive: true, isCustom: false },
  { type: 'STATE_NAME', value: 'TN', displayName: 'Tamil Nadu', isActive: true, isCustom: false },
  { type: 'STATE_NAME', value: 'AP', displayName: 'Andhra Pradesh', isActive: true, isCustom: false },
  { type: 'STATE_NAME', value: 'TS', displayName: 'Telangana', isActive: true, isCustom: false }
];

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({
    PARTICULARS: [],
    CLIENT_CODE: [],
    SITE_NAME: [],
    STATE_NAME: []
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  // Initialize default data when user logs in
  useEffect(() => {
    if (user) {
      console.log('🔥 USER LOGGED IN - Initializing data for user:', user.email, 'Role:', user.role);
      initializeDefaultData();
    } else {
      console.log('🚫 NO USER - Clearing data');
    }
  }, [user]);

  // Initialize default dropdown options if they don't exist
  const initializeDefaultData = async () => {
    try {
      console.log('🔍 Checking for existing dropdown options...');
      
      // Check if any dropdown options exist
      const snapshot = await getDocs(query(collection(db, 'dropdown_options'), limit(1)));
      
      if (snapshot.empty) {
        console.log('📝 No dropdown options found. Initializing default data...');
        
        // Add all default options
        for (const option of DEFAULT_DROPDOWN_OPTIONS) {
          try {
            const docRef = await addDoc(collection(db, 'dropdown_options'), {
              ...option,
              createdAt: new Date(),
              createdBy: 'system'
            });
            console.log(`✅ Added default option: ${option.type} - ${option.value} (ID: ${docRef.id})`);
          } catch (error) {
            console.error('❌ Error adding default option:', option, error);
          }
        }
        
        console.log('🎉 Default dropdown options initialized successfully');
      } else {
        console.log('✅ Dropdown options already exist, count:', snapshot.size);
      }

      // Initialize counters collection if it doesn't exist
      try {
        const countersRef = doc(db, 'counters', 'entries');
        await setDoc(countersRef, { count: 0 }, { merge: true });
        console.log('✅ Counters collection initialized');
      } catch (error) {
        console.error('❌ Error initializing counters:', error);
      }

    } catch (error) {
      console.error('💥 Error initializing default data:', error);
    }
  };

  // Real-time listener for entries
  useEffect(() => {
    if (!user) {
      console.log('🚫 No user - clearing entries and dropdown options');
      setEntries([]);
      setDropdownOptions({
        PARTICULARS: [],
        CLIENT_CODE: [],
        SITE_NAME: [],
        STATE_NAME: []
      });
      setPagination({ currentPage: 1, totalPages: 1, total: 0 });
      return;
    }

    console.log('👂 Setting up real-time listeners for user:', user.email);
    setLoading(true);

    // Listen to entries collection in real-time
    // Note: Do not filter by isActive at query level to include legacy docs without this field
    const entriesQuery = query(
      collection(db, 'entries'),
      orderBy('SL_NO', 'desc'),
      limit(100)
    );
    
    const unsubscribeEntries = onSnapshot(entriesQuery, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          _id: doc.id, // Add _id for compatibility
          ...doc.data() 
        }))
        // Exclude only entries explicitly soft-deleted
        .filter(entry => entry.isActive !== false);
      
      console.log('📊 Entries snapshot received - count:', data.length);
      if (data.length > 0) {
        console.log('📄 Sample entry:', data[0]);
      }
      
      setEntries(data);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: data.length
      });
      setLoading(false);
    }, (error) => {
      console.error('💥 Error fetching entries:', error);
      setEntries([]);
      setLoading(false);
    });

    // Listen to dropdown options in real-time
    const types = ['PARTICULARS', 'CLIENT_CODE', 'SITE_NAME', 'STATE_NAME'];
    const unsubDropdowns = [];
    const options = { 
      PARTICULARS: [], 
      CLIENT_CODE: [], 
      SITE_NAME: [], 
      STATE_NAME: [] 
    };

    types.forEach(type => {
      // Do not filter by isActive at query level to include legacy docs without this field
      const q = query(
        collection(db, 'dropdown_options'),
        where('type', '==', type)
      );
      
      const unsub = onSnapshot(q, (snapshot) => {
        console.log(`📝 ${type} dropdown snapshot received - count:`, snapshot.size);
        
        // Get Firestore options and format them properly
        const firestoreOptions = snapshot.docs
          .map(doc => ({
            id: doc.id,
            _id: doc.id, // Add _id for compatibility
            value: doc.data().value,
            displayName: doc.data().displayName || doc.data().value,
            ...doc.data()
          }))
          // Exclude only options explicitly marked inactive
          .filter(opt => opt.isActive !== false);
        
        // Merge with defaults, avoiding duplicates
        const defaultsForType = DEFAULT_DROPDOWN_OPTIONS.filter(opt => opt.type === type);
        const merged = [
          ...defaultsForType,
          ...firestoreOptions.filter(
            fso => !defaultsForType.some(def => def.value === fso.value)
          )
        ];
        
        options[type] = merged;
        console.log(`✅ ${type} options loaded:`, options[type].map(opt => opt.value));
        setDropdownOptions({ ...options });
      }, (error) => {
        console.error(`💥 Error fetching ${type} options:`, error);
      });
      
      unsubDropdowns.push(unsub);
    });

    return () => {
      console.log('🔌 Cleaning up real-time listeners');
      unsubscribeEntries();
      unsubDropdowns.forEach(unsub => unsub());
    };
  }, [user]);

  // Get next serial number
  const getNextSerialNumber = async () => {
    try {
      console.log('🔢 Getting next serial number...');
      // Simple approach: count existing entries + 1
      const entriesSnapshot = await getDocs(collection(db, 'entries'));
      const nextSerial = entriesSnapshot.size + 1;
      console.log('✅ Next serial number:', nextSerial, '(Total entries:', entriesSnapshot.size, ')');
      return nextSerial;
    } catch (error) {
      console.error('💥 Error getting serial number:', error);
      return 1;
    }
  };

  // Generate reference code (matching Android logic)
  const generateReferenceCode = (entryData, slNo) => {
    console.log('🔧 Generating reference code with data:', entryData, 'Serial:', slNo);
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Calculate Financial Year
    // FY starts from April (month 4) to March (month 3) of next year
    let fyYear;
    if (currentMonth >= 4) {
      // April to December: Use current year as FY start year
      fyYear = currentYear;
    } else {
      // January to March: Use previous year as FY start year
      fyYear = currentYear - 1;
    }
    
    // Format: YYMM (last 2 digits of FY start year + month)
    const fyYearShort = fyYear.toString().slice(-2);
    const month = String(currentMonth).padStart(2, '0');
    const fyDate = `${fyYearShort}${month}`;
    
    const incrementalCount = String(slNo % 100).padStart(2, '0');
    
    const refCode = `IPR/${entryData.PARTICULARS}/${entryData.CLIENT_CODE}/${Math.round(entryData.CAPACITY_MW)}MW/${entryData.STATE_NAME}/${entryData.SITE_NAME}/${fyDate}/${incrementalCount}`;
    
    console.log('✅ Generated reference code:', refCode);
    console.log('📅 FY calculation:', {
      currentDate: now.toISOString(),
      currentMonth,
      currentYear,
      fyYear,
      fyDate
    });
    return refCode;
  };

  // Create a new entry in Firestore
  const createEntry = async (entryData) => {
    console.log('🚀 Starting createEntry process...');
    console.log('👤 Current user:', user ? { email: user.email, uid: user.uid, role: user.role } : 'NULL');
    console.log('📝 Entry data received:', entryData);
    
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('🔢 Getting next serial number...');
      const nextSlNo = await getNextSerialNumber();
      
      console.log('🔧 Generating reference code...');
      const referenceCode = generateReferenceCode(entryData, nextSlNo);
      
      const entryToCreate = {
        SL_NO: nextSlNo,
        USER_NAME: user.username || user.email.split('@')[0],
        PARTICULARS: entryData.PARTICULARS,
        CLIENT_CODE: entryData.CLIENT_CODE,
        CAPACITY_MW: parseFloat(entryData.CAPACITY_MW),
        STATE_NAME: entryData.STATE_NAME,
        SITE_NAME: entryData.SITE_NAME,
        REFERENCE_CODE: referenceCode,
        CREATED_BY: user.uid,
        CREATED_AT: new Date(),
        MODIFIED_BY: null,
        MODIFIED_AT: null,
        isActive: true
      };

      console.log('💾 Creating entry in Firestore:', entryToCreate);
      
      const docRef = await addDoc(collection(db, 'entries'), entryToCreate);
      console.log('✅ Entry created successfully with ID:', docRef.id);
      
      // Update with document ID
      await updateDoc(docRef, { id: docRef.id });
      console.log('✅ Entry updated with document ID');
      
      console.log('🎉 Entry creation completed successfully!');
    } catch (error) {
      console.error('💥 Error creating entry:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  // Update an entry in Firestore
  const updateEntry = async (id, entryData) => {
    console.log('🔄 Starting updateEntry process...');
    console.log('🆔 Entry ID:', id);
    console.log('📝 Update data:', entryData);
    console.log('👤 Current user:', user ? { email: user.email, uid: user.uid, role: user.role } : 'NULL');
    
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }
    
    // Check if user is admin
    const isAdmin = user.email === 'alphonsajose145@gmail.com';
    console.log('🔐 Admin check - Is admin:', isAdmin, 'Email:', user.email);
    
    if (!isAdmin) {
      console.error('❌ Only admins can edit entries');
      throw new Error('Only admins can edit entries');
    }
    
    try {
      console.log('💾 Updating entry in Firestore...');
      
      const entryRef = doc(db, 'entries', id);
      await updateDoc(entryRef, {
        PARTICULARS: entryData.PARTICULARS,
        CLIENT_CODE: entryData.CLIENT_CODE,
        CAPACITY_MW: parseFloat(entryData.CAPACITY_MW),
        STATE_NAME: entryData.STATE_NAME,
        SITE_NAME: entryData.SITE_NAME,
        MODIFIED_BY: user.uid,
        MODIFIED_AT: new Date()
      });
      
      console.log('✅ Entry updated successfully');
    } catch (error) {
      console.error('💥 Error updating entry:', error);
      throw error;
    }
  };

  // Delete an entry in Firestore (soft delete)
  const deleteEntry = async (id) => {
    console.log('🗑️ Starting deleteEntry process...');
    console.log('🆔 Entry ID:', id);
    console.log('👤 Current user:', user ? { email: user.email, uid: user.uid, role: user.role } : 'NULL');
    
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }
    
    // Check if user is admin
    const isAdmin = user.email === 'alphonsajose145@gmail.com';
    console.log('🔐 Admin check - Is admin:', isAdmin, 'Email:', user.email);
    
    if (!isAdmin) {
      console.error('❌ Only admins can delete entries');
      throw new Error('Only admins can delete entries');
    }
    
    try {
      console.log('💾 Soft deleting entry in Firestore...');
      
      const entryRef = doc(db, 'entries', id);
      await updateDoc(entryRef, { 
        isActive: false,
        MODIFIED_BY: user.uid,
        MODIFIED_AT: new Date()
      });
      
      console.log('✅ Entry deleted successfully');
    } catch (error) {
      console.error('💥 Error deleting entry:', error);
      throw error;
    }
  };

  // Add a custom dropdown option in Firestore
  const addCustomOption = async (type, value) => {
    console.log('➕ Adding custom option...');
    console.log('📝 Type:', type, 'Value:', value);
    console.log('👤 Current user:', user ? { email: user.email, uid: user.uid } : 'NULL');
    
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      const optionData = { 
        type, 
        value: value.toUpperCase(),
        displayName: value,
        isActive: true,
        isCustom: true,
        createdAt: new Date(),
        createdBy: user.uid
      };
      
      console.log('💾 Adding option to Firestore:', optionData);
      
      const docRef = await addDoc(collection(db, 'dropdown_options'), optionData);
      
      console.log(`✅ Added custom ${type} option: ${value} (ID: ${docRef.id})`);
    } catch (error) {
      console.error('💥 Error adding custom option:', error);
      throw error;
    }
  };

  // Manual fetch methods (keeping for compatibility)
  const fetchEntries = async (page = 1, search = '', sortBy = 'SL_NO', sortOrder = 'desc') => {
    console.log('📞 fetchEntries called - using real-time data');
  };

  const fetchDropdownOptions = async () => {
    console.log('📞 fetchDropdownOptions called - using real-time data');
  };

  const exportData = async () => {
    throw new Error('Export not supported on client. Please implement on backend or use Firestore export tools.');
  };

  const getStats = async () => {
    throw new Error('Stats not supported on client. Please implement on backend or use Firestore export tools.');
  };

  // Log current state for debugging
  useEffect(() => {
    console.log('📊 DataContext State Update:');
    console.log('- Entries count:', entries.length);
    console.log('- Dropdown options loaded:', {
      PARTICULARS: dropdownOptions.PARTICULARS?.length || 0,
      CLIENT_CODE: dropdownOptions.CLIENT_CODE?.length || 0,
      SITE_NAME: dropdownOptions.SITE_NAME?.length || 0,
      STATE_NAME: dropdownOptions.STATE_NAME?.length || 0
    });
    console.log('- Loading:', loading);
    console.log('- User:', user ? user.email : 'None');
  }, [entries, dropdownOptions, loading, user]);

  const value = {
    entries,
    dropdownOptions,
    loading,
    pagination,
    fetchEntries,
    fetchDropdownOptions,
    createEntry,
    updateEntry,
    deleteEntry,
    addCustomOption,
    exportData,
    getStats
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}