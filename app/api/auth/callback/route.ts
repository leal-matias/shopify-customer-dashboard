/**
 * Shopify OAuth Callback
 * 
 * After merchant authorizes the app, Shopify redirects here
 * with a code that we exchange for an access token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyHmac } from '@/lib/shopify/verify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const hmac = searchParams.get('hmac');
  const state = searchParams.get('state'); // This is the host parameter

  if (!code || !shop || !hmac) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Verify HMAC in production
  if (process.env.NODE_ENV === 'production') {
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });
    
    if (!verifyShopifyHmac(query, hmac)) {
      return NextResponse.json(
        { error: 'Invalid HMAC' },
        { status: 401 }
      );
    }
  }

  // Exchange code for access token
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'App not configured' },
      { status: 500 }
    );
  }

  try {
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: apiSecret,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // In production, store this token securely (database)
    // For this PoC, we'll just log it
    console.log('='.repeat(50));
    console.log('ACCESS TOKEN RECEIVED');
    console.log('Shop:', shop);
    console.log('Token:', accessToken);
    console.log('='.repeat(50));
    console.log('');
    console.log('Add this to your .env.local:');
    console.log(`SHOPIFY_ADMIN_ACCESS_TOKEN=${accessToken}`);
    console.log('');

    // Redirect back to Shopify Admin
    const host = state || Buffer.from(`admin.shopify.com/store/${shop.replace('.myshopify.com', '')}`).toString('base64');
    const redirectUrl = `https://${Buffer.from(host, 'base64').toString()}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json(
      { error: 'OAuth failed' },
      { status: 500 }
    );
  }
}

