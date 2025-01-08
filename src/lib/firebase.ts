'use client'

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA08EALgkP62GTKx_BvAthZLtooe-48w6s",
  authDomain: "lyricsync-98ddd.firebaseapp.com",
  projectId: "lyricsync-98ddd",
  storageBucket: "lyricsync-98ddd.firebasestorage.app",
  messagingSenderId: "323105683662",
  appId: "1:323105683662:web:bd7fa812748e317829789f"
}

// Firebase'i sadece client tarafında ve bir kere başlat
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Auth ve Firestore servislerini al
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app 