/**
 * Shopify Storefront API Configuration
 * 
 * This configuration connects to your Shopify store's Storefront API
 * which allows customer authentication and data access.
 */

export const shopifyConfig = {
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '',
  storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
  apiVersion: '2024-01', // Shopify API version
} as const;

export function getStorefrontApiUrl(): string {
  return `https://${shopifyConfig.storeDomain}/api/${shopifyConfig.apiVersion}/graphql.json`;
}

export function getStorefrontHeaders(customerAccessToken?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontAccessToken,
  };

  if (customerAccessToken) {
    headers['X-Shopify-Customer-Access-Token'] = customerAccessToken;
  }

  return headers;
}

