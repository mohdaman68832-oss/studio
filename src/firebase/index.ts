
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { firebaseConfig } from './config';

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  analytics?: Analytics;
} {
  const firebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  
  let analytics;
  // Only attempt to initialize analytics if we have a valid-looking API key
  // and we are running in the browser.
  if (typeof window !== 'undefined' && firebaseConfig.apiKey !== 'placeholder-api-key') {
    isSupported().then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(firebaseApp);
        } catch (e) {
          console.warn('Analytics initialization failed:', e);
        }
      }
    });
  }

  return { firebaseApp, firestore, auth, analytics };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
