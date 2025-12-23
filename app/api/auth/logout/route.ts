/**
 * Customer Logout API Route
 * 
 * POST /api/auth/logout
 * Logs out the customer and destroys the session
 */

import { NextResponse } from 'next/server';
import { logoutCustomer } from '@/lib/shopify/client';
import { getSession } from '@/lib/session';

export async function POST() {
  try {
    const session = await getSession();

    // If there's an access token, invalidate it on Shopify's side
    if (session.customerAccessToken) {
      await logoutCustomer(session.customerAccessToken);
    }

    // Destroy the session
    session.customerAccessToken = undefined;
    session.tokenExpiresAt = undefined;
    session.isLoggedIn = false;
    await session.save();

    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

