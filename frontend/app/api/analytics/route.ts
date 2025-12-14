/**
 * Analytics API Route
 *
 * POST /api/analytics - Track an analytics event
 * GET /api/analytics - Get metrics (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/infra/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  processAnalyticsEvent,
  getEventDateString,
  getDailyIncrements,
  getTotalIncrements,
  createEmptyDailyMetrics,
  createEmptyTotalMetrics,
  isAdminEmail,
} from '../../../../shared/core';
import type { DailyMetrics, TotalMetrics } from '../../../../shared/core';

// Rate limiting: max events per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // events per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Get country from request headers (Vercel provides this)
function getCountryFromRequest(request: NextRequest): string {
  return request.headers.get('x-vercel-ip-country') ||
         request.geo?.country ||
         'XX';
}

// Get IP from request
function getIpFromRequest(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * POST /api/analytics
 *
 * Track an analytics event
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request);

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Add server-side metadata
    const country = getCountryFromRequest(request);
    if (!body.metadata) body.metadata = {};
    body.metadata.country = country;

    // Process and validate event
    const result = processAnalyticsEvent(body);

    if (!result.valid || !result.event) {
      return NextResponse.json(
        { error: result.error || 'Invalid event' },
        { status: 400 }
      );
    }

    const event = result.event;
    const db = getAdminDb();
    const dateStr = getEventDateString(event.timestamp);

    // Store raw event (for detailed analysis later)
    // Filter out undefined values (Firestore doesn't accept undefined)
    const eventToStore: Record<string, unknown> = {
      event: event.event,
      installationId: event.installationId,
      timestamp: event.timestamp,
      metadata: event.metadata,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (event.userId) eventToStore.userId = event.userId;
    if (event.data && Object.keys(event.data).length > 0) eventToStore.data = event.data;

    await db.collection('analytics_events').add(eventToStore);

    // Update daily metrics
    const dailyRef = db.collection('metrics').doc('daily').collection('days').doc(dateStr);
    const dailyDoc = await dailyRef.get();

    const dailyIncrements = getDailyIncrements(event);

    if (!dailyDoc.exists) {
      // Create new daily record
      const newDaily = createEmptyDailyMetrics(dateStr);
      await dailyRef.set({
        ...newDaily,
        ...applyIncrements(newDaily, dailyIncrements),
      });
    } else {
      // Update existing daily record - use set with merge to handle missing fields
      const updates: Record<string, unknown> = {};
      const currentData = dailyDoc.data() || {};

      for (const [key, value] of Object.entries(dailyIncrements)) {
        if (key === 'installsByCountry' && typeof value === 'object') {
          // Handle nested country increments
          for (const [countryCode, count] of Object.entries(value as Record<string, number>)) {
            updates[`installsByCountry.${countryCode}`] = FieldValue.increment(count);
          }
        } else if (typeof value === 'number') {
          // Check if field exists, if not initialize it first
          if (currentData[key] === undefined) {
            updates[key] = value; // Set initial value
          } else {
            updates[key] = FieldValue.increment(value);
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await dailyRef.set(updates, { merge: true });
      }
    }

    // Update total metrics
    const totalsRef = db.collection('metrics').doc('totals');
    const totalsDoc = await totalsRef.get();

    const totalIncrements = getTotalIncrements(event);

    if (!totalsDoc.exists) {
      // Create new totals record
      const newTotals = createEmptyTotalMetrics();
      await totalsRef.set({
        ...newTotals,
        ...applyIncrements(newTotals, totalIncrements),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Update existing totals - use set with merge to handle missing fields
      const updates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      const currentData = totalsDoc.data() || {};

      for (const [key, value] of Object.entries(totalIncrements)) {
        if (typeof value === 'number' && key !== 'lastEventAt') {
          // Check if field exists, if not initialize it first
          if (currentData[key] === undefined) {
            updates[key] = value;
          } else {
            updates[key] = FieldValue.increment(value);
          }
        } else if (key === 'lastEventAt') {
          updates[key] = value;
        }
      }

      if (Object.keys(updates).length > 0) {
        await totalsRef.set(updates, { merge: true });
      }
    }

    // Track unique active users/installations for daily metrics
    if (event.installationId && event.installationId !== 'web') {
      const activeRef = db
        .collection('metrics')
        .doc('daily')
        .collection('days')
        .doc(dateStr)
        .collection('active_installations')
        .doc(event.installationId);

      const activeDoc = await activeRef.get();
      if (!activeDoc.exists) {
        await activeRef.set({ firstSeen: event.timestamp });
        await dailyRef.update({
          activeInstallations: FieldValue.increment(1),
        });
      }
    }

    if (event.userId) {
      const activeUserRef = db
        .collection('metrics')
        .doc('daily')
        .collection('days')
        .doc(dateStr)
        .collection('active_users')
        .doc(event.userId);

      const activeUserDoc = await activeUserRef.get();
      if (!activeUserDoc.exists) {
        await activeUserRef.set({ firstSeen: event.timestamp });
        await dailyRef.update({
          activeUsers: FieldValue.increment(1),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error tracking analytics:', {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    return NextResponse.json(
      { error: 'Failed to track event', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics
 *
 * Get metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const db = getAdminDb();
    const url = new URL(request.url);
    const range = url.searchParams.get('range') || '7d';

    // Get totals
    const totalsDoc = await db.collection('metrics').doc('totals').get();
    const totals = totalsDoc.exists
      ? (totalsDoc.data() as TotalMetrics)
      : createEmptyTotalMetrics();

    // Get daily metrics for range
    const days = range === '30d' ? 30 : range === '7d' ? 7 : 1;
    const dailyDocs = await db
      .collection('metrics')
      .doc('daily')
      .collection('days')
      .orderBy('date', 'desc')
      .limit(days)
      .get();

    const daily: DailyMetrics[] = [];
    dailyDocs.forEach((doc) => {
      daily.push(doc.data() as DailyMetrics);
    });

    return NextResponse.json({
      totals,
      daily,
      range,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper to apply increments to a metrics object
function applyIncrements<T extends Record<string, unknown>>(
  base: T,
  increments: Partial<T>
): T {
  const result = { ...base };

  for (const [key, value] of Object.entries(increments)) {
    if (key === 'installsByCountry' && typeof value === 'object') {
      const baseCountries = (result as Record<string, unknown>).installsByCountry as Record<string, number> || {};
      for (const [country, count] of Object.entries(value as Record<string, number>)) {
        baseCountries[country] = (baseCountries[country] || 0) + count;
      }
      (result as Record<string, unknown>).installsByCountry = baseCountries;
    } else if (typeof value === 'number' && typeof (result as Record<string, unknown>)[key] === 'number') {
      ((result as Record<string, unknown>)[key] as number) += value;
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}
