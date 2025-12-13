/**
 * Email Service
 *
 * High-level email service that combines templates with the email adapter.
 * Use this in API routes instead of directly using the adapter.
 */

import { getEmailService } from './resend-adapter';
import {
  getWelcomeEmailTemplate,
  getExtendTrialEmailTemplate,
  getLicenseActivatedEmailTemplate,
} from './templates';
import type {
  EmailSendResult,
  WelcomeEmailData,
  ExtendTrialEmailData,
  LicenseActivatedEmailData,
} from './types';

export class EmailService {
  private adapter = getEmailService();

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailSendResult> {
    const { subject, html } = getWelcomeEmailTemplate(data);

    return this.adapter.send({
      to: { email: data.email, name: data.name },
      subject,
      html,
    });
  }

  /**
   * Send magic link to extend trial
   */
  async sendExtendTrialEmail(email: string, magicLink: string): Promise<EmailSendResult> {
    const { subject, html } = getExtendTrialEmailTemplate({ magicLink });

    return this.adapter.send({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send license activation confirmation
   */
  async sendLicenseActivatedEmail(data: LicenseActivatedEmailData & { email: string }): Promise<EmailSendResult> {
    const { subject, html } = getLicenseActivatedEmailTemplate(data);

    return this.adapter.send({
      to: { email: data.email, name: data.name },
      subject,
      html,
    });
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export function getEmailServiceInstance(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}
