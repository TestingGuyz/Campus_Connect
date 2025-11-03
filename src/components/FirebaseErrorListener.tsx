'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It logs any received error to the console instead of throwing it.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log the full error context to the console for debugging.
      console.error(
        "A Firestore permission error was caught by the global listener:", 
        {
          message: error.message,
          context: error.context,
        }
      );
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // This component renders nothing.
  return null;
}
