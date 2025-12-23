/**
 * App Installation Handler
 * 
 * When merchants install the app from Shopify Admin,
 * they are redirected here with OAuth parameters.
 * 
 * This page initiates the OAuth flow to get an access token.
 */

import { redirect } from 'next/navigation';

interface InstallPageProps {
  searchParams: Promise<{
    shop?: string;
    hmac?: string;
    timestamp?: string;
    host?: string;
  }>;
}

export default async function InstallPage({ searchParams }: InstallPageProps) {
  const params = await searchParams;
  const { shop, host } = params;

  if (!shop) {
    return (
      <div style={{ 
        padding: '2rem', 
        fontFamily: 'system-ui', 
        maxWidth: '600px', 
        margin: '0 auto' 
      }}>
        <h1>Shopify App Installation</h1>
        <p>Missing shop parameter. Please install from the Shopify Admin.</p>
      </div>
    );
  }

  // For a full implementation, you would:
  // 1. Verify the HMAC
  // 2. Check if the shop already has an access token
  // 3. If not, redirect to Shopify OAuth
  // 4. Store the access token after OAuth callback

  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes = process.env.SHOPIFY_SCOPES || 'read_customers';
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;

  if (!apiKey) {
    return (
      <div style={{ 
        padding: '2rem', 
        fontFamily: 'system-ui', 
        maxWidth: '600px', 
        margin: '0 auto' 
      }}>
        <h1>Configuration Required</h1>
        <p>Please set SHOPIFY_API_KEY in your environment variables.</p>
        <h2>Setup Steps:</h2>
        <ol>
          <li>Create a Shopify App in your Partner Dashboard</li>
          <li>Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET</li>
          <li>Configure the App URL and Redirect URLs</li>
        </ol>
      </div>
    );
  }

  // Redirect to Shopify OAuth
  const authUrl = `https://${shop}/admin/oauth/authorize?` + 
    `client_id=${apiKey}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${host || ''}`;

  redirect(authUrl);
}

