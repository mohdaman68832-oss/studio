'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Robust singleton SDK initialization for Next.js environments.
 * Uses globalThis to ensure instances are preserved across HMR and Turbopack refreshes.
 */
declare global {
  var _firebaseApp: FirebaseApp | undefined;
  var _firestore: Firestore | undefined;
  var _auth: Auth | undefined;
}

export function initializeFirebase() {
  if (typeof window === 'undefined') {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
  }

  if (!globalThis._firebaseApp) {
    globalThis._firebaseApp = initializeApp(firebaseConfig);
    globalThis._firestore = getFirestore(globalThis._firebaseApp);
    globalThis._auth = getAuth(globalThis._firebaseApp);
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
