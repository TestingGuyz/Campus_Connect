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
import { useAuth } from '@/hooks/use-auth';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemoFirebase to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references.
 *
 * This hook will only attempt to fetch data if the provided query is not null AND after authentication is resolved.
 * It is the responsibility of the calling component to ensure the query is null
 * until all necessary dependencies (like user ID) are available.
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Hook waits if this is null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { user, isAuthLoading } = useAuth();
  const [isHookLoading, setIsHookLoading] = useState(true);

  useEffect(() => {
    // --- Strict Guard ---
    // 1. Wait for authentication to finish.
    // 2. If auth is finished and there's no user, we can stop. There's nothing to query.
    // 3. If there is a user, but the query itself is null (e.g., waiting for other dependencies), also stop.
    if (isAuthLoading || !user || !memoizedTargetRefOrQuery) {
      setIsHookLoading(false); // Not loading data if we don't have a user or query
      setData(null);
      setError(null);
      return;
    }
    
    // At this point, auth is done, we have a user, and we have a query. Start loading.
    setIsHookLoading(true);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsHookLoading(false); // Data loaded successfully.
      },
      (serverError: FirestoreError) => {
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsHookLoading(false); // Finished with an error.

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, user, isAuthLoading]); // user and isAuthLoading are critical dependencies
  
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('useCollection query was not properly memoized using useMemoFirebase. This can cause infinite loops.');
  }

  // The overall loading state is true if auth is still resolving OR if the hook is actively fetching data after auth is done.
  const isLoading = isAuthLoading || isHookLoading;
  
  return { data, isLoading, error };
}
