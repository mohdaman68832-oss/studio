'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Truly Singleton Firebase Initialization for Next.js 15 / Turbopack.
 * This ensures only one instance of each service exists even across HMR.
 * We store instances on globalThis/window to prevent "Internal Assertion" errors.
 */
let cachedApp: FirebaseApp | null = null;
let cachedFirestore: Firestore | null = null;
let cachedAuth: Auth | null = null;

export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win._firebaseApp) cachedApp = win._firebaseApp;
    if (win._firebaseFirestore) cachedFirestore = win._firebaseFirestore;
    if (win._firebaseAuth) cachedAuth = win._firebaseAuth;
  }

  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') (window as any)._firebaseApp = cachedApp;
  }

  if (!cachedFirestore) {
    cachedFirestore = getFirestore(cachedApp);
    if (typeof window !== 'undefined') (window as any)._firebaseFirestore = cachedFirestore;
  }

  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
    if (typeof window !== 'undefined') (window as any)._firebaseAuth = cachedAuth;
  }

  return {
    firebaseApp: cachedApp,
    firestore: cachedFirestore,
    auth: cachedAuth,
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
