/**
 * Email Infrastructure Module
 *
 * Usage:
 *   import { getEmailServiceInstance } from '@/infra/email';
 *   const emailService = getEmailServiceInstance();
 *   await emailService.sendWelcomeEmail({ name: 'John', email: 'john@example.com' });
 */

export * from './types';
export * from './templates';
export * from './resend-adapter';
export * from './email-service';
