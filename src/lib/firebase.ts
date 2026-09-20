
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB4GcD0C95cHxENVmCBmKxJOoOoIzeyMNg",
  authDomain: "mandobak-2034.firebaseapp.com",
  databaseURL: "https://mandobak-2034-default-rtdb.firebaseio.com",
  projectId: "mandobak-2034",
  storageBucket: "mandobak-2034.firebasestorage.app",
  messagingSenderId: "834071990416",
  appId: "1:834071990416:web:de8b0137c30a7f98708815",
  measurementId: "G-GLHTSRH5GD"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
