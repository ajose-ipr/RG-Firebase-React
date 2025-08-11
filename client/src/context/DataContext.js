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
  setDoc,
  getDoc
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
      initializeDefaultData();
    }
  }, [user]);

  // Initialize default dropdown options if they don't exist
  const initializeDefaultData = async () => {
    try {
      // Check if any dropdown options exist
      const snapshot = await getDocs(query(collection(db, 'dropdown_options'), limit(1)));
      
      if (snapshot.empty) {
        // Add all default options
        for (const option of DEFAULT_DROPDOWN_OPTIONS) {
          try {
            await addDoc(collection(db, 'dropdown_options'), {
              ...option,
              createdAt: new Date(),
              createdBy: 'system'
            });
          } catch (error) {
            console.error('Error adding default option:', error);
          }
        }
      }

      // Initialize global counter for cumulative count
      try {
        const globalCounterRef = doc(db, 'counters', 'entries');
        const globalCounterSnap = await getDoc(globalCounterRef);
        
        if (!globalCounterSnap.exists()) {
          await setDoc(globalCounterRef, { count: 0 });
        }
      } catch (error) {
        console.error('Error initializing global counter:', error);
      }

      // Initialize legacy entries counter (for compatibility)
      try {
        const countersRef = doc(db, 'counters', 'entries');
        await setDoc(countersRef, { count: 0 }, { merge: true });
      } catch (error) {
        console.error('Error initializing legacy counters:', error);
      }

    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  };

  // Real-time listener for entries
  useEffect(() => {
    if (!user) {
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

    setLoading(true);

    // Listen to entries collection in real-time
    const entriesQuery = query(
      collection(db, 'entries'),
      orderBy('SL_NO', 'desc'),
      limit(100)
    );
    
    const unsubscribeEntries = onSnapshot(entriesQuery, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          _id: doc.id,
          ...doc.data() 
        }))
        .filter(entry => entry.isActive !== false);
      
      setEntries(data);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: data.length
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching entries:', error);
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
      const q = query(
        collection(db, 'dropdown_options'),
        where('type', '==', type)
      );
      
      const unsub = onSnapshot(q, (snapshot) => {
        const firestoreOptions = snapshot.docs
          .map(doc => ({
            id: doc.id,
            _id: doc.id,
            value: doc.data().value,
            displayName: doc.data().displayName || doc.data().value,
            ...doc.data()
          }))
          .filter(opt => opt.isActive !== false);
        
        const defaultsForType = DEFAULT_DROPDOWN_OPTIONS.filter(opt => opt.type === type);
        const merged = [
          ...defaultsForType,
          ...firestoreOptions.filter(
            fso => !defaultsForType.some(def => def.value === fso.value)
          )
        ];
        
        options[type] = merged;
        setDropdownOptions({ ...options });
      }, (error) => {
        console.error(`Error fetching ${type} options:`, error);
      });
      
      unsubDropdowns.push(unsub);
    });

    return () => {
      unsubscribeEntries();
      unsubDropdowns.forEach(unsub => unsub());
    };
  }, [user]);

  // Get cumulative count (total entries across all financial years)
  const getCumulativeCount = async () => {
    try {
      const globalCounterRef = doc(db, 'counters', 'entries');
      const snapshot = await getDoc(globalCounterRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentCount = data.count || 0;
        const nextCount = currentCount + 1;
        await updateDoc(globalCounterRef, { count: nextCount });
        return nextCount;
      } else {
        await setDoc(globalCounterRef, { count: 1 });
        return 1;
      }
    } catch (error) {
      console.error('Error getting cumulative count:', error);
      // Fallback: count total entries
      const totalEntries = await getDocs(collection(db, 'entries'));
      return totalEntries.size + 1;
    }
  };

  // Get incremental count for current financial year
  const getIncrementalCountForCurrentFY = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();
      
      // Calculate Financial Year (April to March cycle)
      const financialYear = currentMonth >= 4 ? (currentYear + 1) % 100 : currentYear % 100;
      
      const fyDocId = `fy_${financialYear}`;
      const fyCounterRef = doc(db, 'counters', fyDocId);
      const snapshot = await getDoc(fyCounterRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentCount = data.incremental_count || 0;
        const nextCount = currentCount + 1;
        await updateDoc(fyCounterRef, { incremental_count: nextCount });
        return nextCount;
      } else {
        const newFYData = {
          financial_year: financialYear,
          incremental_count: 1,
          created_at: new Date()
        };
        await setDoc(fyCounterRef, newFYData);
        return 1;
      }
    } catch (error) {
      console.error('Error getting incremental count for FY:', error);
      return 1;
    }
  };

  // Get next serial number (for backward compatibility)
  const getNextSerialNumber = async () => {
    try {
      return await getCumulativeCount();
    } catch (error) {
      console.error('Error getting serial number:', error);
      return 1;
    }
  };

  // Generate reference code (matching Android logic exactly)
  const generateReferenceCode = async (entryData, cumulativeCount) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Calculate Financial Year (April to March cycle - same as Android)
    const financialYear = currentMonth >= 4 ? (currentYear + 1) % 100 : currentYear % 100;
    
    // Get incremental count for current FY
    const incrementalCount = await getIncrementalCountForCurrentFY();
    
    // Format: FY + cumulative count (e.g., 26321 = FY26 + 321 total entries)
    const fyFormatted = financialYear.toString().padStart(2, '0');
    const cumulativeFormatted = cumulativeCount.toString().padStart(3, '0');
    const fyWithCumulative = fyFormatted + cumulativeFormatted;
    
    // Format incremental count (e.g., 05 = 5th entry in current FY)
    const incrementalFormatted = incrementalCount.toString().padStart(2, '0');
    
    const refCode = `IPR/${entryData.PARTICULARS}/${entryData.CLIENT_CODE}/${Math.round(entryData.CAPACITY_MW)}MW/${entryData.STATE_NAME}/${entryData.SITE_NAME}/${fyWithCumulative}/${incrementalFormatted}`;
    
    console.log('Reference code generated:', refCode, `(FY: ${financialYear}, Cumulative: ${cumulativeCount}, Incremental: ${incrementalCount})`);
    
    return refCode;
  };

  // Create a new entry in Firestore
  const createEntry = async (entryData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const cumulativeCount = await getCumulativeCount();
      const referenceCode = await generateReferenceCode(entryData, cumulativeCount);
      
      const entryToCreate = {
        SL_NO: cumulativeCount,
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

      const docRef = await addDoc(collection(db, 'entries'), entryToCreate);
      await updateDoc(docRef, { id: docRef.id });
      
      console.log('Entry created successfully:', referenceCode);
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  };

  // Update an entry in Firestore
  const updateEntry = async (id, entryData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const isAdmin = user.email === 'alphonsajose145@gmail.com';
    if (!isAdmin) {
      throw new Error('Only admins can edit entries');
    }
    
    try {
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
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  // Delete an entry in Firestore (soft delete)
  const deleteEntry = async (id) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const isAdmin = user.email === 'alphonsajose145@gmail.com';
    if (!isAdmin) {
      throw new Error('Only admins can delete entries');
    }
    
    try {
      const entryRef = doc(db, 'entries', id);
      await updateDoc(entryRef, { 
        isActive: false,
        MODIFIED_BY: user.uid,
        MODIFIED_AT: new Date()
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  // Add a custom dropdown option in Firestore
  const addCustomOption = async (type, value) => {
    if (!user) {
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
      
      await addDoc(collection(db, 'dropdown_options'), optionData);
    } catch (error) {
      console.error('Error adding custom option:', error);
      throw error;
    }
  };

  // Manual fetch methods (keeping for compatibility)
  const fetchEntries = async (page = 1, search = '', sortBy = 'SL_NO', sortOrder = 'desc') => {
    // Using real-time data
  };

  const fetchDropdownOptions = async () => {
    // Using real-time data
  };

  const exportData = async () => {
    throw new Error('Export not supported on client. Please implement on backend or use Firestore export tools.');
  };

  const getStats = async () => {
    throw new Error('Stats not supported on client. Please implement on backend or use Firestore export tools.');
  };

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

// Get cumulative count (all entries)
export async function getCumulativeCount() {
  const snapshot = await getDocs(collection(db, 'entries'));
  return snapshot.size;
}

// Get incremental count for current FY
export async function getIncrementalCountForFY() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // FY starts in April
  const fyStart = new Date(year, 3, 1, 0, 0, 0, 0); // April 1st

  const q = query(
    collection(db, 'entries'),
    where('CREATED_AT', '>=', fyStart)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Get current FY as two digits (e.g., 2026 => "26")
export function getCurrentFYShort() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return String(year).slice(-2);
}