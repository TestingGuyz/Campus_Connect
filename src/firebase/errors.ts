'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * A custom error class designed to provide better debugging information for Firestore permission errors.
 * This version is simplified to be stable and avoid causing crashes during its own construction.
 */
export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    // Create a simple, stable error message.
    const message = `FirestorePermissionError: An operation on path '${context.path}' was denied. Operation: ${context.operation}.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // It's often helpful to log the context to the console for debugging.
    // This will appear in the developer console, not as part of the thrown error overlay.
    console.error("Firestore Permission Error Context:", context);
  }
}
