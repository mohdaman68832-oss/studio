'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Truly Singleton Firebase Initialization for Next.js 15 / Turbopack.
 * Uses globalThis and module-level caching to survive HMR/Fast Refresh.
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

let cachedSdks: FirebaseInstances | null = null;

export function initializeFirebase(): FirebaseInstances {
  // 1. Use module-level cache if already initialized in this execution context
  if (cachedSdks) return cachedSdks;

  // 2. Client-side: Persist on globalThis/window to survive Turbopack HMR reloads
  if (typeof window !== 'undefined') {
    if (!globalThis._firebaseApp) {
      try {
        const app = initializeApp(firebaseConfig);
        globalThis._firebaseApp = app;
        globalThis._firestore = getFirestore(app);
        globalThis._auth = getAuth(app);
      } catch (e) {
        // Fallback if initializeApp was somehow called twice
        if (getApps().length) {
          globalThis._firebaseApp = getApp();
          globalThis._firestore = getFirestore(globalThis._firebaseApp);
          globalThis._auth = getAuth(globalThis._firebaseApp);
        } else {
          throw e;
        }
      }
    }

    cachedSdks = {
      firebaseApp: globalThis._firebaseApp!,
      firestore: globalThis._firestore!,
      auth: globalThis._auth!,
    };
    return cachedSdks;
  }

  // 3. Server-side (SSR) Fallback
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
