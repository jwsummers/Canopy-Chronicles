import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


// Your Firebase configuration (single project for Auth, Firestore, and Storage)
const firebaseConfig = {
  apiKey: "AIzaSyBeauciOFxQhaKW3bWTmlqiC4K-VojUTY8",
  authDomain: "canopy-chronicles-firestore.firebaseapp.com",
  projectId: "canopy-chronicles-firestore",
  storageBucket: "canopy-chronicles-firestore.appspot.com",
  messagingSenderId: "68449402159",
  appId: "1:68449402159:web:cfaa5baa7c5768298db5da",
  measurementId: "G-MY8S0XJN62"
};

// Initialize Firebase with the unified configuration
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
