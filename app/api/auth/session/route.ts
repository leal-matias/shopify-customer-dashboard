/**
 * Session Status API Route
 * 
 * GET /api/auth/session
 * Returns the current authentication status and customer data
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic';
import { getCustomer } from '@/lib/shopify/client';
import { getSession, isTokenExpired } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    // Check if logged in and token is valid
    if (!session.isLoggedIn || !session.customerAccessToken) {
      return NextResponse.json({
        isLoggedIn: false,
        customer: null,
      });
    }

    // Check if token has expired
    if (isTokenExpired(session.tokenExpiresAt)) {
      // Clear the expired session
      session.customerAccessToken = undefined;
      session.tokenExpiresAt = undefined;
      session.isLoggedIn = false;
      await session.save();

      return NextResponse.json({
        isLoggedIn: false,
        customer: null,
        error: 'Session expired',
      });
    }

    // Fetch customer data from Shopify
    const customer = await getCustomer(session.customerAccessToken);

    if (!customer) {
      // Token might be invalid, clear session
      session.customerAccessToken = undefined;
      session.tokenExpiresAt = undefined;
      session.isLoggedIn = false;
      await session.save();

      return NextResponse.json({
        isLoggedIn: false,
        customer: null,
      });
    }

    return NextResponse.json({
      isLoggedIn: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        displayName: customer.displayName,
        email: customer.email,
        numberOfOrders: customer.numberOfOrders,
      },
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { 
        isLoggedIn: false, 
        customer: null,
        error: 'An error occurred checking session' 
      },
      { status: 500 }
    );
  }
}

