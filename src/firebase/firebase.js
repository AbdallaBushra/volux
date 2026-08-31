// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ التكوين الصحيح من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBqscEnUQJr2abDH3VRKxu_3UtXTtlJHlo",
  authDomain: "volux-db1.firebaseapp.com",
  projectId: "volux-db1",
  storageBucket: "volux-db1.firebasestorage.app",
  messagingSenderId: "115951249256",
  appId: "1:115951249256:web:937aca8408a43d3382d8dd",
  measurementId: "G-S9BZ54G82D"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة الخدمات
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// تصدير الخدمات
export { app, auth, db, storage };
export default app;