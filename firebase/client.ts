import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB0gn2fi6fj_43770rEocwXo_Cwp4koIBU",
    authDomain: "interviewiq-8a26b.firebaseapp.com",
    projectId: "interviewiq-8a26b",
    storageBucket: "interviewiq-8a26b.firebasestorage.app",
    messagingSenderId: "871727007063",
    appId: "1:871727007063:web:04d631ae1f2f3a3bcf2a12"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
