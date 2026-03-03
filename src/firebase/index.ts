'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Truly Singleton Firebase Initialization for Next.js 15 / Turbopack.
 * Uses a module-level cache and globalThis to survive HMR/Fast Refresh reloads.
 */
let cachedSdks: FirebaseInstances | null = null;

interface FirebaseInstances {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

declare global {
  var _firebaseInstances: FirebaseInstances | undefined;
}

export function initializeFirebase(): FirebaseInstances {
  // Return cached instances if available in the current module or global scope
  if (cachedSdks) return cachedSdks;
  if (typeof window !== 'undefined' && globalThis._firebaseInstances) {
    cachedSdks = globalThis._firebaseInstances;
    return cachedSdks;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const instances = {
    firebaseApp: app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };

  // Cache in module and global scope for maximum stability during HMR
  if (typeof window !== 'undefined') {
    cachedSdks = instances;
    globalThis._firebaseInstances = instances;
  }

  return instances;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
