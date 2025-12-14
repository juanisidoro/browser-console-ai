/**
 * Get Extended Token API Route
 *
 * GET /api/license/get-extended-token?installationId=xxx
 *
 * Returns the new token if the trial has been extended.
 * Called by the extension after user clicks magic link.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/infra/firebase/admin';
import type { TrialLicense } from '../../../../../shared/core';
import { signTrialToken } from '@/infra/licensing/jwt-service';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const installationId = url.searchParams.get('installationId');

    if (!installationId) {
      return NextResponse.json({
        success: false,
        message: 'Installation ID is required',
      }, { status: 400 });
    }

    const db = getAdminDb();

    // Get trial data
    const trialRef = db.collection('trials').doc(installationId);
    const trialDoc = await trialRef.get();

    if (!trialDoc.exists) {
      return NextResponse.json({
        success: false,
        extended: false,
        message: 'No trial found',
      });
    }

    const trialData = trialDoc.data() as TrialLicense;

    // Check if trial was extended
    if (!trialData.extended) {
      return NextResponse.json({
        success: false,
        extended: false,
        message: 'Trial has not been extended yet',
      });
    }

    // Generate fresh token with current expiry
    const token = await signTrialToken(
      installationId,
      trialData.tokenId,
      trialData.expiresAt,
      { email: trialData.email, userId: trialData.userId }
    );

    const daysRemaining = Math.ceil((trialData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

    return NextResponse.json({
      success: true,
      extended: true,
      token,
      expiresAt: new Date(trialData.expiresAt).toISOString(),
      daysRemaining,
      email: trialData.email,
    });

  } catch (error) {
    console.error('Error getting extended token:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred',
    }, { status: 500 });
  }
}
