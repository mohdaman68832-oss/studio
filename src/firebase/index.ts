
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Truly Singleton Firebase Initialization for Next.js 15 / Turbopack.
 * We store instances on globalThis/window to prevent "Internal Assertion" errors 
 * caused by multiple initializations during HMR (Hot Module Replacement).
 */

const getGlobal = () => {
  if (typeof window !== 'undefined') return window as any;
  if (typeof globalThis !== 'undefined') return globalThis as any;
  return {} as any;
};

export function initializeFirebase() {
  const g = getGlobal();

  // Ensure we only initialize once across hot reloads
  if (!g._firebaseApp) {
    g._firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  if (!g._firebaseFirestore) {
    // Setting long-lived cache and settings is done once
    g._firebaseFirestore = getFirestore(g._firebaseApp);
  }

  if (!g._firebaseAuth) {
    g._firebaseAuth = getAuth(g._firebaseApp);
  }

  return {
    firebaseApp: g._firebaseApp as FirebaseApp,
    firestore: g._firebaseFirestore as Firestore,
    auth: g._firebaseAuth as Auth,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
