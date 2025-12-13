/**
 * Resend Email Adapter
 *
 * Implementation of IEmailService using Resend.
 * Can be swapped with SendGrid, Mailgun, etc. by implementing the same interface.
 */

import { Resend } from 'resend';
import type { IEmailService, EmailMessage, EmailSendResult } from './types';

const DEFAULT_FROM = 'Browser Console AI <noreply@browserconsoleai.com>';

export class ResendEmailAdapter implements IEmailService {
  private client: Resend;
  private from: string;

  constructor(apiKey?: string, from?: string) {
    const key = apiKey || process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY is required');
    }
    this.client = new Resend(key);
    this.from = from || DEFAULT_FROM;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const to = typeof message.to === 'string'
        ? message.to
        : message.to.email;

      const { data, error } = await this.client.emails.send({
        from: this.from,
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
      });

      if (error) {
        console.error('[ResendAdapter] Send error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (err) {
      console.error('[ResendAdapter] Exception:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance for convenience
let emailServiceInstance: IEmailService | null = null;

export function getEmailService(): IEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new ResendEmailAdapter();
  }
  return emailServiceInstance;
}
