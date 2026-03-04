
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; 
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * Professional Real-time Collection Hook
 * Optimized to handle authentication states and robust error reporting.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    const auth = getAuth();
    
    // Auth Guard: Wait for a stable user session to prevent premature permission errors
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsLoading(false);
        setData(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const unsubscribeSnapshot = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const results: WithId<T>[] = [];
          snapshot.forEach((doc) => {
            results.push({ ...(doc.data() as T), id: doc.id });
          });
          setData(results);
          setError(null);
          setIsLoading(false);
        },
        async (err: FirestoreError) => {
          // Identify if it's an index requirement or a real permission denial
          const isIndexError = err.code === 'failed-precondition' || err.message.toLowerCase().includes('index');
          
          if (!isIndexError) {
            let path = "unknown_collection";
            try {
              const anyRef = memoizedTargetRefOrQuery as any;
              path = anyRef.path || (anyRef._query?.path?.segments?.join('/')) || "collection";
            } catch (e) {}

            // Check if the error is actually permission related
            if (err.code === 'permission-denied') {
              const contextualError = new FirestorePermissionError({
                operation: 'list',
                path,
              });
              setError(contextualError);
              errorEmitter.emit('permission-error', contextualError);
            } else {
              setError(err);
            }
          } else {
            // Use console.warn instead of console.error to avoid the disruptive Next.js dev overlay
            console.warn("Firestore Index Status:", err.message);
            setError(err);
          }
          
          setData(null);
          setIsLoading(false);
        }
      );

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [memoizedTargetRefOrQuery]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Collection/Query was not properly memoized using useMemoFirebase. This can cause infinite loops.');
  }
  return { data, isLoading, error };
}
