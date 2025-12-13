/**
 * Auth Domain - Identity entities (WHO you are)
 *
 * This domain handles user identity only.
 * For permissions/entitlements, see licensing domain.
 */

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Session {
  userId: string;
  email: string;
  createdAt: number;  // Unix timestamp
  expiresAt: number;  // Unix timestamp
}
