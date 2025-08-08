import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCXEOvnbaGHLEkptMahuvbhPCPQydx2D4o",
  authDomain: "ref-gen-234.firebaseapp.com",
  projectId: "ref-gen-234",
  storageBucket: "ref-gen-234.firebasestorage.app",
  messagingSenderId: "282512508609",
  appId: "1:282512508609:web:f8450a8ede32cabe363640",
  measurementId: "G-NHQNDYDSWZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);