/**
 * Email Templates
 *
 * Centralized email templates for all transactional emails.
 */

import type { WelcomeEmailData, ExtendTrialEmailData, LicenseActivatedEmailData } from './types';

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0a0a0f;
  color: #e5e5e5;
  padding: 40px 20px;
`;

const CONTAINER_STYLES = `
  max-width: 480px;
  margin: 0 auto;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 40px;
  border: 1px solid #2d2d44;
`;

const BUTTON_STYLES = `
  display: inline-block;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  text-decoration: none;
  padding: 16px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
`;

const FOOTER_STYLES = `
  font-size: 12px;
  color: #4b5563;
  text-align: center;
`;

function wrapTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${BASE_STYLES}">
      <div style="${CONTAINER_STYLES}">
        ${content}
        <hr style="border: none; border-top: 1px solid #2d2d44; margin: 32px 0;">
        <p style="${FOOTER_STYLES}">
          Browser Console AI - Capture browser logs for AI agents
        </p>
      </div>
    </body>
    </html>
  `;
}

export function getWelcomeEmailTemplate(data: WelcomeEmailData): { subject: string; html: string } {
  const displayName = data.name || 'Developer';

  return {
    subject: 'Welcome to Browser Console AI!',
    html: wrapTemplate(`
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: #ffffff;">
          Welcome to Browser Console AI!
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #a0aec0; margin-bottom: 24px;">
        Hi <strong style="color: #ffffff;">${displayName}</strong>,
      </p>

      <p style="font-size: 16px; line-height: 1.6; color: #a0aec0; margin-bottom: 24px;">
        Thanks for joining Browser Console AI! You're now ready to capture browser console logs and send them directly to your AI agents via MCP.
      </p>

      <div style="background: #0f0f1a; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #8b5cf6; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          Quick Start
        </h3>
        <ol style="color: #a0aec0; margin: 0; padding-left: 20px; line-height: 2;">
          <li>Install the Chrome extension</li>
          <li>Click the extension icon to open the sidepanel</li>
          <li>Hit "Start Recording" and interact with your app</li>
          <li>Stop and send logs to your AI agent</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://browserconsoleai.com/docs" style="${BUTTON_STYLES}">
          Read the Docs
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        Have questions? Reply to this email or check our <a href="https://browserconsoleai.com/docs" style="color: #8b5cf6;">documentation</a>.
      </p>
    `)
  };
}

export function getExtendTrialEmailTemplate(data: ExtendTrialEmailData): { subject: string; html: string } {
  return {
    subject: 'Extend your Browser Console AI trial (+3 days)',
    html: wrapTemplate(`
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #ffffff;">
          🎁 Extend Your Trial
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #a0aec0; margin-bottom: 24px;">
        Click the button below to add <strong style="color: #8b5cf6;">3 more days</strong> to your Browser Console AI trial.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.magicLink}" style="${BUTTON_STYLES.replace('#6366f1', '#8b5cf6').replace('#8b5cf6', '#7c3aed')}">
          Extend My Trial
        </a>
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
        This link expires in 1 hour and can only be used once.
      </p>

      <p style="font-size: 13px; color: #6b7280;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `)
  };
}

export function getLicenseActivatedEmailTemplate(data: LicenseActivatedEmailData): { subject: string; html: string } {
  const planDisplay = data.plan === 'pro_early' ? 'PRO (Early Adopter)' : data.plan.toUpperCase();

  return {
    subject: `Your ${planDisplay} license is active!`,
    html: wrapTemplate(`
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #ffffff;">
          🎉 License Activated!
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #a0aec0; margin-bottom: 24px;">
        Hi <strong style="color: #ffffff;">${data.name}</strong>,
      </p>

      <p style="font-size: 16px; line-height: 1.6; color: #a0aec0; margin-bottom: 24px;">
        Your <strong style="color: #8b5cf6;">${planDisplay}</strong> license is now active. You have access to all premium features:
      </p>

      <div style="background: #0f0f1a; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <ul style="color: #a0aec0; margin: 0; padding-left: 20px; line-height: 2;">
          <li>Unlimited logs per recording</li>
          <li>Unlimited recordings</li>
          <li>MCP server integration</li>
          <li>Export to JSON/CSV</li>
          <li>Priority support</li>
        </ul>
      </div>

      ${data.expiresAt ? `
        <p style="font-size: 14px; color: #6b7280;">
          Your license is valid until <strong style="color: #ffffff;">${data.expiresAt}</strong>.
        </p>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://browserconsoleai.com/dashboard" style="${BUTTON_STYLES}">
          Go to Dashboard
        </a>
      </div>
    `)
  };
}
