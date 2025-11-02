'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'; // Renamed User to FirebaseUser
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { User } from '@/contexts/auth-context'; // Import your app's user type

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  firebaseUser: FirebaseUser | null; // The raw Firebase user
  isAuthLoading: boolean; // Renamed for clarity
  authError: Error | null; // Renamed for clarity
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [authState, setAuthState] = useState<{
    firebaseUser: FirebaseUser | null;
    isAuthLoading: boolean;
    authError: Error | null;
  }>({
    firebaseUser: null,
    isAuthLoading: true, // Start loading until first auth event
    authError: null,
  });

  useEffect(() => {
    if (!auth) {
      setAuthState({ firebaseUser: null, isAuthLoading: false, authError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthState({ firebaseUser: user, isAuthLoading: false, authError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setAuthState({ firebaseUser: null, isAuthLoading: false, authError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    firebaseUser: authState.firebaseUser,
    isAuthLoading: authState.isAuthLoading,
    authError: authState.authError,
  }), [firebaseApp, firestore, auth, authState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


// --- HOOKS ---

function useFirebaseContext() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase hook must be used within a FirebaseProvider.');
  }
  return context;
}

/** Hook to access Firebase Auth instance. */
export const useAuthInstance = (): Auth | null => useFirebaseContext().auth;

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore | null => useFirebaseContext().firestore;

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp | null => useFirebaseContext().firebaseApp;

/**
 * Hook specifically for accessing the raw Firebase user's state.
 * This is useful for checking the raw authentication status directly from Firebase.
 */
export const useFirebaseUser = () => {
  const { firebaseUser, isAuthLoading, authError } = useFirebaseContext();
  return { user: firebaseUser, isLoading: isAuthLoading, error: authError };
};


/**
 * A special version of useMemo that marks the object as memoized.
 * This is a workaround to help prevent infinite loops with Firestore hooks.
 */
type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
