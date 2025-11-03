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
    // Create a simple, stable error message that is informative.
    const message = `FirestorePermissionError: The operation '${context.operation}' on path '${context.path}' was denied by security rules.`;
    
    super(message);
    
    this.name = 'FirestorePermissionError';
    this.context = context;

    // Ensure the prototype chain is correctly set up.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
