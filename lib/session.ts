/**
 * Session Management using iron-session
 * 
 * This handles secure, encrypted session cookies to store
 * the customer's access token between requests.
 */

import { getIronSession, SessionOptions, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

// Session data structure
export interface SessionData {
  customerAccessToken?: string;
  tokenExpiresAt?: string;
  isLoggedIn: boolean;
}

// Session configuration
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'shopify_customer_session',
  cookieOptions: {
    // Secure in production, not required in development
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

// Default session values
export const defaultSession: SessionData = {
  isLoggedIn: false,
};

/**
 * Get the current session from cookies (Server Component compatible)
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  // Initialize with defaults if empty
  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }
  
  return session;
}

/**
 * Check if the access token has expired
 */
export function isTokenExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

