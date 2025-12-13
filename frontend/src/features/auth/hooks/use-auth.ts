'use client';

/**
 * useAuth Hook
 *
 * Simplified hook for consuming auth context in components.
 * Re-exports auth context with cleaner API.
 */

import { useAuthContext } from '../components/auth-provider';

export function useAuth() {
  return useAuthContext();
}
