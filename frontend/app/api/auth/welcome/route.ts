/**
 * Welcome Email API Route
 *
 * POST /api/auth/welcome
 *
 * Sends a welcome email to new users after registration.
 * Idempotent - will not send if already sent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/infra/firebase/admin';
import { getEmailServiceInstance } from '@/infra/email';

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: WelcomeEmailRequest = await request.json();
    const { email, name, userId } = body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userMetaRef = db.collection('user_metadata').doc(userId);
    const userMeta = await userMetaRef.get();

    // Check if welcome email was already sent (idempotent)
    if (userMeta.exists && userMeta.data()?.welcomeEmailSent) {
      return NextResponse.json({
        success: true,
        alreadySent: true,
        message: 'Welcome email already sent',
      });
    }

    // Send welcome email
    const emailService = getEmailServiceInstance();
    const result = await emailService.sendWelcomeEmail({
      email,
      name: name || 'Developer',
    });

    if (!result.success) {
      console.error('[WelcomeEmail] Failed to send:', result.error);
      return NextResponse.json({
        success: false,
        message: 'Failed to send welcome email',
      }, { status: 500 });
    }

    // Mark welcome email as sent
    await userMetaRef.set({
      welcomeEmailSent: true,
      welcomeEmailSentAt: Date.now(),
      email: email.toLowerCase(),
    }, { merge: true });

    console.log(`[WelcomeEmail] Sent to ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent',
    });

  } catch (error) {
    console.error('[WelcomeEmail] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
