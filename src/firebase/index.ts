'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Truly Singleton Firebase Initialization for Next.js 15 / Turbopack.
 * Uses a module-level cache and globalThis to survive HMR/Fast Refresh reloads.
 */
let cachedApp: FirebaseApp | null = null;
let cachedFirestore: Firestore | null = null;
let cachedAuth: Auth | null = null;

declare global {
  var _firebaseApp: FirebaseApp | undefined;
  var _firebaseFirestore: Firestore | undefined;
  var _firebaseAuth: Auth | undefined;
}

export function initializeFirebase() {
  // 1. App Singleton
  if (!cachedApp) {
    if (typeof window !== 'undefined' && globalThis._firebaseApp) {
      cachedApp = globalThis._firebaseApp;
    } else {
      cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      if (typeof window !== 'undefined') globalThis._firebaseApp = cachedApp;
    }
  }

  // 2. Firestore Singleton
  if (!cachedFirestore) {
    if (typeof window !== 'undefined' && globalThis._firebaseFirestore) {
      cachedFirestore = globalThis._firebaseFirestore;
    } else {
      cachedFirestore = getFirestore(cachedApp);
      if (typeof window !== 'undefined') globalThis._firebaseFirestore = cachedFirestore;
    }
  }

  // 3. Auth Singleton
  if (!cachedAuth) {
    if (typeof window !== 'undefined' && globalThis._firebaseAuth) {
      cachedAuth = globalThis._firebaseAuth;
    } else {
      cachedAuth = getAuth(cachedApp);
      if (typeof window !== 'undefined') globalThis._firebaseAuth = cachedAuth;
    }
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
