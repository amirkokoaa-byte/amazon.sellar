import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDUNg-f1uGoanzMmnaJUdA35xzosJaAnOY",
  authDomain: "fir-de6c2.firebaseapp.com",
  databaseURL: "https://fir-de6c2-default-rtdb.firebaseio.com",
  projectId: "fir-de6c2",
  storageBucket: "fir-de6c2.firebasestorage.app",
  messagingSenderId: "962099561294",
  appId: "1:962099561294:web:7536f488705b9a6358541f",
  measurementId: "G-N0BKW23SDV"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Make db available on window as requested
if (typeof window !== 'undefined') {
  (window as unknown as { db: typeof db }).db = db;
}
