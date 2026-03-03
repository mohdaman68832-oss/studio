'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Truly Singleton Firebase Initialization for Next.js 15 / Turbopack.
 * Survives HMR/Hot Reloads by caching instances on globalThis and window.
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
  // 1. Check for existing instances in Global State (Node/Server)
  if (globalThis._firebaseApp) cachedApp = globalThis._firebaseApp;
  if (globalThis._firebaseFirestore) cachedFirestore = globalThis._firebaseFirestore;
  if (globalThis._firebaseAuth) cachedAuth = globalThis._firebaseAuth;

  // 2. Check for existing instances in Window (Browser)
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win._firebaseApp) cachedApp = win._firebaseApp;
    if (win._firebaseFirestore) cachedFirestore = win._firebaseFirestore;
    if (win._firebaseAuth) cachedAuth = win._firebaseAuth;
  }

  // 3. Initialize App Singleton
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    globalThis._firebaseApp = cachedApp;
    if (typeof window !== 'undefined') (window as any)._firebaseApp = cachedApp;
  }

  // 4. Initialize Firestore Singleton
  if (!cachedFirestore) {
    cachedFirestore = getFirestore(cachedApp);
    globalThis._firebaseFirestore = cachedFirestore;
    if (typeof window !== 'undefined') (window as any)._firebaseFirestore = cachedFirestore;
  }

  // 5. Initialize Auth Singleton
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
    globalThis._firebaseAuth = cachedAuth;
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
