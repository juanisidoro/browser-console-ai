/**
 * Admin Utilities
 *
 * Functions for admin access control.
 */

// Default admin emails (keep in sync with shared/core/analytics/entities.ts)
export const DEFAULT_ADMIN_EMAILS = [
  'juan.isidoro.gc@gmail.com'
];

/**
 * Check if an email has admin access
 */
export function isAdminEmail(email: string, additionalAdmins: string[] = []): boolean {
  const allAdmins = [...DEFAULT_ADMIN_EMAILS, ...additionalAdmins];
  return allAdmins.includes(email.toLowerCase());
}
