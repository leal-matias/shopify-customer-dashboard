/**
 * App Proxy Customer Endpoint
 * 
 * This endpoint is called via Shopify App Proxy.
 * When a customer is logged in on the storefront, Shopify passes
 * their customer ID in the query parameters (signed).
 * 
 * App Proxy URL format:
 * https://your-store.myshopify.com/apps/dashboard/api/proxy/customer
 * 
 * Shopify adds these parameters automatically:
 * - logged_in_customer_id: The customer's ID (if logged in)
 * - shop: The shop domain
 * - signature: HMAC signature to verify the request
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAppProxySignature } from '@/lib/shopify/verify';
import { getCustomerById } from '@/lib/shopify/admin-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Convert to object for verification
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Verify the request is from Shopify
  if (process.env.NODE_ENV === 'production') {
    const isValid = verifyAppProxySignature(query);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
  }

  const shop = query.shop;
  const customerId = query.logged_in_customer_id;

  // Check if customer is logged in
  if (!customerId) {
    return NextResponse.json({
      isLoggedIn: false,
      customer: null,
      message: 'Customer not logged in on storefront',
    });
  }

  // Fetch customer data using Admin API
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  
  if (!accessToken) {
    // Fallback: Return basic info from the proxy parameters
    return NextResponse.json({
      isLoggedIn: true,
      customer: {
        id: customerId,
        // App Proxy only passes the ID, we need Admin API for details
      },
      message: 'Admin API token not configured - limited data available',
    });
  }

  const customer = await getCustomerById(shop, accessToken, customerId);

  if (!customer) {
    return NextResponse.json({
      isLoggedIn: true,
      customer: { id: customerId },
      message: 'Could not fetch customer details',
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
      numberOfOrders: customer.ordersCount,
    },
  });
}

