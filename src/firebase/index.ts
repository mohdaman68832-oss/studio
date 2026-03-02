'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Module-level cache to ensure singleton SDK instances across HMR/Fast Refresh
let cachedSdks: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null = null;

/**
 * Initializes Firebase App and Services once and returns the cached instances.
 * This pattern prevents Firestore "INTERNAL ASSERTION FAILED" errors during development.
 */
export function initializeFirebase() {
  if (cachedSdks) {
    return cachedSdks;
  }

  let firebaseApp: FirebaseApp;

  if (!getApps().length) {
    try {
      // Attempt to initialize via Firebase App Hosting environment variables first
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    firebaseApp = getApp();
  }

  cachedSdks = {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };

  return cachedSdks;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
