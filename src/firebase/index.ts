'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Robust singleton SDK initialization for Next.js 15 environments.
 * Prevents "Internal Assertion Failed" by caching instances on globalThis.
 */
declare global {
  var _firebaseApp: FirebaseApp | undefined;
  var _firestore: Firestore | undefined;
  var _auth: Auth | undefined;
}

export function initializeFirebase() {
  // SSR check
  if (typeof window === 'undefined') {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
  }

  // Client-side singleton pattern using globalThis to survive HMR/Turbopack refreshes
  if (!globalThis._firebaseApp) {
    try {
      globalThis._firebaseApp = initializeApp(firebaseConfig);
      globalThis._firestore = getFirestore(globalThis._firebaseApp);
      globalThis._auth = getAuth(globalThis._firebaseApp);
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

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';