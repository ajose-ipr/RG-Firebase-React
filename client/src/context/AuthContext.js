import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

console.log('🚀 AuthContext module loaded');

const AuthContext = createContext();

export function AuthProvider({ children }) {
  console.log('🔧 AuthProvider component initializing');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('📊 Initial auth state:', { user: user?.email || 'none', loading });

  useEffect(() => {
    console.log('🔄 Setting up Firebase auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔔 Firebase auth state changed:', firebaseUser ? firebaseUser.email : 'User signed out');
      
      if (firebaseUser) {
        console.log('👤 Processing authenticated user:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified
        });
        
        try {
          // Check if this is the admin email
          const isAdmin = firebaseUser.email === 'alphonsajose145@gmail.com';
          console.log('🔐 Admin check result:', { email: firebaseUser.email, isAdmin });
          
          // Try to get user profile from Firestore
          console.log('📄 Fetching user profile from Firestore for UID:', firebaseUser.uid);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData;
          if (userDoc.exists()) {
            console.log('✅ User document found in Firestore');
            userData = userDoc.data();
            console.log('📊 Existing user data:', {
              email: userData.email,
              role: userData.role,
              username: userData.username,
              isActive: userData.isActive
            });
            
            // Update role if needed (for existing users)
            if (isAdmin && userData.role !== 'admin') {
              console.log('🔧 Updating user role to admin');
              await setDoc(userDocRef, { ...userData, role: 'admin' }, { merge: true });
              userData.role = 'admin';
              console.log('✅ User role updated to admin');
            }
          } else {
            console.log('⚠️ User document not found, creating new profile');
            // Create user profile if doesn't exist
            const role = isAdmin ? 'admin' : 'user';
            userData = {
              email: firebaseUser.email,
              username: firebaseUser.email.split('@')[0],
              role: role,
              createdAt: new Date(),
              isActive: true
            };
            console.log('📝 Creating new user profile:', userData);
            await setDoc(userDocRef, userData);
            console.log('✅ New user profile created successfully');
          }
          
          // Set user with role information
          const userWithRole = {
            ...firebaseUser,
            role: userData.role,
            username: userData.username || firebaseUser.email.split('@')[0]
          };
          
          console.log('👤 User authenticated successfully:', {
            email: userWithRole.email,
            role: userWithRole.role,
            username: userWithRole.username,
            uid: userWithRole.uid
          });
          setUser(userWithRole);
          
        } catch (error) {
          console.error('❌ Error fetching/creating user profile:', error);
          console.error('📊 Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          
          // Fallback to email-based role
          console.log('🔄 Falling back to email-based role assignment');
          const isAdmin = firebaseUser.email === 'alphonsajose145@gmail.com';
          const fallbackUser = {
            ...firebaseUser, 
            role: isAdmin ? 'admin' : 'user',
            username: firebaseUser.email.split('@')[0]
          };
          console.log('⚠️ Using fallback user data:', {
            email: fallbackUser.email,
            role: fallbackUser.role,
            username: fallbackUser.username
          });
          setUser(fallbackUser);
        }
      } else {
        console.log('🚪 User signed out, clearing user state');
        setUser(null);
      }
      
      console.log('🏁 Auth state processing complete, setting loading to false');
      setLoading(false);
    });
    
    return () => {
      console.log('🧹 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    console.log('🔑 Login attempt started for email:', email);
    try {
      // Ensure routes relying on auth state show loading during transition
      setLoading(true);
      console.log('📞 Calling Firebase signInWithEmailAndPassword');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase login successful, auth state will update automatically');
      // user state will update automatically via onAuthStateChanged
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('📊 Login error details:', {
        code: error.code,
        message: error.message,
        email: email
      });
      // Reset loading if login fails to avoid indefinite spinner
      setLoading(false);
      throw error; // Re-throw to let calling component handle
    }
  };

  const register = async (email, password) => {
    console.log('📝 Registration attempt started for email:', email);
    try {
      // Ensure routes relying on auth state show loading during transition
      setLoading(true);
      console.log('📞 Calling Firebase createUserWithEmailAndPassword');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase registration successful for UID:', result.user.uid);
      
      // Create user profile in Firestore
      const isAdmin = email === 'alphonsajose145@gmail.com';
      console.log('🔐 Admin check for new user:', { email, isAdmin });
      
      const userData = {
        email: email,
        username: email.split('@')[0],
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date(),
        isActive: true
      };
      
      console.log('📝 Creating user profile document:', userData);
      await setDoc(doc(db, 'users', result.user.uid), userData);
      console.log('✅ User profile document created successfully');
      
      // user state will update automatically via onAuthStateChanged
    } catch (error) {
      console.error('❌ Registration failed:', error);
      console.error('📊 Registration error details:', {
        code: error.code,
        message: error.message,
        email: email
      });
      // Reset loading if registration fails
      setLoading(false);
      throw error; // Re-throw to let calling component handle
    }
  };

  const logout = async () => {
    console.log('🚪 Logout attempt started for user:', user?.email || 'unknown');
    try {
      console.log('📞 Calling Firebase signOut');
      await signOut(auth);
      console.log('🧹 Clearing user state');
      setUser(null);
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      console.error('📊 Logout error details:', {
        code: error.code,
        message: error.message,
        currentUser: user?.email
      });
      throw error; // Re-throw to let calling component handle
    }
  };

  console.log('🔧 AuthProvider rendering with context value:', {
    hasUser: !!user,
    userEmail: user?.email,
    userRole: user?.role,
    loading
  });

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  console.log('🪝 useAuth hook called');
  const context = useContext(AuthContext);
  
  if (!context) {
    console.error('❌ useAuth called outside of AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('📊 useAuth returning context:', {
    hasUser: !!context.user,
    userEmail: context.user?.email,
    loading: context.loading
  });
  
  return context;
}