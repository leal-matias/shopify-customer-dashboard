/**
 * Customer Login API Route
 * 
 * POST /api/auth/login
 * Authenticates a customer with Shopify and creates a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginCustomer } from '@/lib/shopify/client';
import { getSession } from '@/lib/session';
import { z } from 'zod';

// Input validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Authenticate with Shopify Storefront API
    const { token, errors } = await loginCustomer(email, password);

    if (errors.length > 0) {
      // Return Shopify's error message
      return NextResponse.json(
        { error: errors[0].message },
        { status: 401 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create session with the access token
    const session = await getSession();
    session.customerAccessToken = token.accessToken;
    session.tokenExpiresAt = token.expiresAt;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ 
      success: true,
      message: 'Logged in successfully' 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

