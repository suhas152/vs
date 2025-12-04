import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

const minimalPresent = [
  firebaseConfig.apiKey,
  firebaseConfig.projectId,
].every(Boolean)

let app, db, auth
let enabled = false
if (minimalPresent) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
    enabled = true
  } catch {}
}

export { enabled, app, db, auth, signInAnonymously }
