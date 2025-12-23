/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Required for Shopify App Proxy
  // Assets must be loaded from your app's domain, not Shopify's
  assetPrefix: process.env.NEXT_PUBLIC_APP_URL || undefined,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
    ],
  },
}

module.exports = nextConfig
