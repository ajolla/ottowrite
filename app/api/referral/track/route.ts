import { NextRequest, NextResponse } from 'next/server';
import { ReferralSystemManager } from '@/lib/referral-system';

export async function POST(request: NextRequest) {
  try {
    const { code, utmParams } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || undefined;

    const result = await ReferralSystemManager.trackReferralClick(
      code,
      ipAddress,
      userAgent,
      referer,
      utmParams
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Set tracking cookie for attribution
    const response = NextResponse.json({
      success: true,
      trackingId: result.trackingId
    });

    response.cookies.set('ref_tracking', result.trackingId!, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('Referral tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track referral' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref');

  if (!ref) {
    return NextResponse.json({ error: 'No referral code provided' }, { status: 400 });
  }

  // Redirect to signup page with referral tracking
  const signupUrl = new URL('/signup', request.url);
  signupUrl.searchParams.set('ref', ref);

  // Copy UTM parameters if present
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
    const value = searchParams.get(param);
    if (value) signupUrl.searchParams.set(param, value);
  });

  return NextResponse.redirect(signupUrl);
}