/**
 * Shopify Request Verification
 * 
 * Utilities to verify that requests are genuinely from Shopify
 * using HMAC signature verification.
 */

import crypto from 'crypto';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

/**
 * Verify HMAC signature from Shopify OAuth/App Proxy requests
 */
export function verifyShopifyHmac(
  query: Record<string, string>,
  hmac: string
): boolean {
  if (!SHOPIFY_API_SECRET) {
    console.warn('SHOPIFY_API_SECRET not set - skipping HMAC verification');
    return true; // Allow in development
  }

  // Create a copy without hmac for verification
  const params = { ...query };
  delete params.hmac;

  // Sort and encode parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Calculate expected HMAC
  const calculatedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac),
    Buffer.from(hmac)
  );
}

/**
 * Verify App Proxy request signature
 * App Proxy uses a slightly different format
 */
export function verifyAppProxySignature(
  query: Record<string, string>
): boolean {
  if (!SHOPIFY_API_SECRET) {
    console.warn('SHOPIFY_API_SECRET not set - skipping signature verification');
    return true; // Allow in development
  }

  const signature = query.signature;
  if (!signature) return false;

  // Create a copy without signature for verification
  const params = { ...query };
  delete params.signature;

  // Sort and encode parameters (App Proxy format)
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('');

  // Calculate expected signature
  const calculatedSignature = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Decode the host parameter (base64)
 */
export function decodeHost(host: string): string {
  return Buffer.from(host, 'base64').toString('utf-8');
}

