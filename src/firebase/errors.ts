'use client';

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface SecurityRuleRequest {
  auth: { uid: string | null }; // Simplified auth object
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a simplified request object for the error message.
 * This version avoids calling getAuth() to prevent initialization errors.
 * @param context The context of the failed Firestore operation.
 * @returns A structured request object.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  // We can't safely get the user here, so we'll represent auth status as unknown.
  // The core information for debugging is the operation and path.
  const authObject = { uid: null };

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

/**
 * Builds the final, formatted error message.
 * @param requestObject The simulated request object.
 * @returns A string containing the error message and the JSON payload.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  // Check if the error is due to being unauthenticated.
  const isAuthNull = !requestObject.auth?.uid;
  const denialReason = isAuthNull
    ? "The request was unauthenticated (auth is null)."
    : "The authenticated user does not have permission.";

  return `FirestoreError: Missing or insufficient permissions. ${denialReason}

The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
}

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 * It structures the error information to mimic the request object
 * available in Firestore Security Rules, but in a more stable way that
 * does not depend on the live auth state.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirestorePermissionError';
    this.request = requestObject;
  }
}
