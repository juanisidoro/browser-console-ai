/**
 * Email Service Types
 *
 * Abstraction layer for email sending.
 * Allows swapping providers (Resend, SendGrid, etc.) without changing business logic.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: string | EmailRecipient;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailService {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

// Email template types
export type EmailTemplateType = 'welcome' | 'extend-trial' | 'license-activated';

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface ExtendTrialEmailData {
  magicLink: string;
}

export interface LicenseActivatedEmailData {
  name: string;
  plan: string;
  expiresAt?: string;
}

export type EmailTemplateData =
  | { type: 'welcome'; data: WelcomeEmailData }
  | { type: 'extend-trial'; data: ExtendTrialEmailData }
  | { type: 'license-activated'; data: LicenseActivatedEmailData };
