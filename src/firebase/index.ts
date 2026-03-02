'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Robust singleton SDK initialization for Next.js environments.
 * Prevents "INTERNAL ASSERTION FAILED" by caching instances globally on the client.
 */
function getCachedSdks() {
  if (typeof window === 'undefined') return null;
  return (window as any)._firebaseSdks || null;
}

function setCachedSdks(sdks: any) {
  if (typeof window !== 'undefined') {
    (window as any)._firebaseSdks = sdks;
  }
}

export function initializeFirebase() {
  const existing = getCachedSdks();
  if (existing) return existing;

  let firebaseApp: FirebaseApp;
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

  setCachedSdks(sdks);
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
