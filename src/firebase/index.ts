'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Truly Singleton Firebase Initialization for Next.js 15 / Turbopack.
 * Uses globalThis to survive HMR/Fast Refresh reloads.
 */
declare global {
  var _firebaseApp: FirebaseApp | undefined;
  var _firestore: Firestore | undefined;
  var _auth: Auth | undefined;
}

interface FirebaseInstances {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

/**
 * Professional Singleton Initialization
 * Optimized for development environments with frequent hot-reloads.
 */
export function initializeFirebase(): FirebaseInstances {
  if (typeof window !== 'undefined') {
    // Client-side singleton pattern using globalThis
    if (!globalThis._firebaseApp) {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      globalThis._firebaseApp = app;
      globalThis._firestore = getFirestore(app);
      globalThis._auth = getAuth(app);
    }

    return {
      firebaseApp: globalThis._firebaseApp!,
      firestore: globalThis._firestore!,
      auth: globalThis._auth!,
    };
  }

  // SSR Fallback (Non-persistent for server renders)
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
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
