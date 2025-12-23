"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string;
  numberOfOrders: string;
}

interface SessionResponse {
  isLoggedIn: boolean;
  customer: Customer | null;
  error?: string;
  message?: string;
}

// Loading component shown during Suspense
function LoadingState() {
  return (
    <>
      <div className="pattern-bg" />
      <div className="loading-state">
        <div className="loading-spinner" />
        <p className="loading-text">Loading your dashboard...</p>
      </div>
    </>
  );
}

// Main content that uses useSearchParams
function HomeContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [authMode, setAuthMode] = useState<"session" | "proxy" | "login">(
    "session"
  );

  // Check if this is an App Proxy request (has signature parameter)
  const isAppProxy =
    searchParams.has("signature") || searchParams.has("logged_in_customer_id");

  // Check if this is a Shopify Admin redirect (has hmac and shop)
  const isShopifyRedirect =
    searchParams.has("hmac") && searchParams.has("shop");
  const shop = searchParams.get("shop");

  const checkSession = useCallback(async () => {
    try {
      // If coming from App Proxy, use the proxy endpoint
      if (isAppProxy) {
        const proxyParams = new URLSearchParams();
        searchParams.forEach((value, key) => {
          proxyParams.append(key, value);
        });

        const response = await fetch(
          `/api/proxy/customer?${proxyParams.toString()}`
        );
        const data: SessionResponse = await response.json();

        setIsLoggedIn(data.isLoggedIn);
        setCustomer(data.customer);
        setAuthMode("proxy");
        return;
      }

      // Otherwise check normal session
      const response = await fetch("/api/auth/session");
      const data: SessionResponse = await response.json();

      setIsLoggedIn(data.isLoggedIn);
      setCustomer(data.customer);
      setAuthMode(data.isLoggedIn ? "session" : "login");
    } catch (error) {
      console.error("Session check failed:", error);
      setIsLoggedIn(false);
      setCustomer(null);
      setAuthMode("login");
    } finally {
      setIsLoading(false);
    }
  }, [isAppProxy, searchParams]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLoginSuccess = () => {
    checkSession();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsLoggedIn(false);
      setCustomer(null);
      setAuthMode("login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Show setup instructions if this is a Shopify redirect without proper config
  if (isShopifyRedirect && !isAppProxy) {
    return (
      <>
        <div className="pattern-bg" />
        <div className="login-page">
          <div className="login-card" style={{ maxWidth: "600px" }}>
            <div className="login-header">
              <div className="login-logo">🔧</div>
              <h1 className="login-title">App Setup Required</h1>
              <p className="login-subtitle">
                Your Shopify App is redirecting here. Complete the setup to
                enable customer authentication.
              </p>
            </div>

            <div style={{ textAlign: "left", fontSize: "0.9rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>Detected Shop</h3>
              <code
                style={{
                  display: "block",
                  padding: "0.75rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}
              >
                {shop}
              </code>

              <h3 style={{ marginBottom: "1rem" }}>Next Steps</h3>
              <ol style={{ paddingLeft: "1.25rem", lineHeight: "2" }}>
                <li>Configure App Proxy in Shopify Admin</li>
                <li>Set environment variables (see below)</li>
                <li>Access via your storefront, not admin</li>
              </ol>

              <h3 style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
                Required Environment Variables
              </h3>
              <pre
                style={{
                  padding: "1rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  overflow: "auto",
                  fontSize: "0.8rem",
                }}
              >
                {`SHOPIFY_API_KEY=your-app-api-key
SHOPIFY_API_SECRET=your-app-api-secret
SHOPIFY_ADMIN_ACCESS_TOKEN=from-oauth-callback
NEXT_PUBLIC_APP_URL=https://your-app-url.com`}
              </pre>

              <h3 style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
                App Proxy Setup
              </h3>
              <p style={{ marginBottom: "0.5rem" }}>
                In your Shopify App settings, add an App Proxy:
              </p>
              <ul style={{ paddingLeft: "1.25rem", lineHeight: "2" }}>
                <li>
                  <strong>Subpath prefix:</strong> apps
                </li>
                <li>
                  <strong>Subpath:</strong> dashboard
                </li>
                <li>
                  <strong>Proxy URL:</strong> your-app-url.com
                </li>
              </ul>
              <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
                Customers will access:{" "}
                <code>https://{shop}/apps/dashboard</code>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <div className="pattern-bg" />
      {isLoggedIn && customer ? (
        <Dashboard
          customer={customer}
          onLogout={handleLogout}
          authMode={authMode}
        />
      ) : (
        <LoginForm onSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

// Main page component with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeContent />
    </Suspense>
  );
}
