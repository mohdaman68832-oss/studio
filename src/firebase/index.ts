'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Module-level cache to ensure singleton SDK instances across HMR/Fast Refresh.
 * This prevents the "INTERNAL ASSERTION FAILED" error during development.
 */
let cachedSdks: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null = null;

/**
 * Initializes Firebase App and Services once and returns the cached instances.
 * Uses a global check to survive Hot Module Replacement (HMR) in development.
 */
export function initializeFirebase() {
  // Check for existing instances in a global scope to survive HMR
  if (typeof window !== 'undefined' && (window as any)._firebaseSdks) {
    return (window as any)._firebaseSdks;
  }

  if (cachedSdks) {
    return cachedSdks;
  }

  let firebaseApp: FirebaseApp;

  // Idempotent initialization
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  const sdks = {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };

  // Cache locally and globally on client
  if (typeof window !== 'undefined') {
    (window as any)._firebaseSdks = sdks;
  }
  cachedSdks = sdks;

  return sdks;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';