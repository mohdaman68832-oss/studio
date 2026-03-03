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

export function initializeFirebase(): FirebaseInstances {
  // Client-side: Persist on globalThis to survive Turbopack HMR reloads
  if (typeof window !== 'undefined') {
    if (!globalThis._firebaseApp) {
      try {
        const app = initializeApp(firebaseConfig);
        globalThis._firebaseApp = app;
        globalThis._firestore = getFirestore(app);
        globalThis._auth = getAuth(app);
      } catch (e) {
        if (getApps().length) {
          globalThis._firebaseApp = getApp();
          globalThis._firestore = getFirestore(globalThis._firebaseApp);
          globalThis._auth = getAuth(globalThis._firebaseApp);
        } else {
          throw e;
        }
      }
    }

    return {
      firebaseApp: globalThis._firebaseApp!,
      firestore: globalThis._firestore!,
      auth: globalThis._auth!,
    };
  }

  // SSR Fallback
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