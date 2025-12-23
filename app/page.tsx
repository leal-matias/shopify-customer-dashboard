"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string;
  numberOfOrders: string;
}

// Loading component
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

// Not logged in component
function NotLoggedIn({ shop }: { shop: string | null }) {
  const storeUrl = shop ? `https://${shop}/account/login` : "#";

  return (
    <>
      <div className="pattern-bg" />
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">🔐</div>
            <h1 className="login-title">Please Log In</h1>
            <p className="login-subtitle">
              You need to be logged in to your store account to access the
              dashboard.
            </p>
          </div>

          <a
            href={storeUrl}
            className="btn btn-primary"
            style={{
              textDecoration: "none",
              display: "block",
              textAlign: "center",
            }}
          >
            Log in to Store
          </a>

          <p
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
            }}
          >
            After logging in, return to this page.
          </p>
        </div>
      </div>
    </>
  );
}

// Main content that uses App Proxy parameters
function HomeContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // App Proxy parameters from Shopify
  const loggedInCustomerId = searchParams.get("logged_in_customer_id");
  const shop = searchParams.get("shop");
  const signature = searchParams.get("signature");

  // Check if this is an App Proxy request
  const isAppProxy = !!signature && !!shop;
  const isCustomerLoggedIn = !!loggedInCustomerId;

  useEffect(() => {
    async function fetchCustomerData() {
      // If not coming from App Proxy or customer not logged in
      if (!isAppProxy) {
        setIsLoading(false);
        return;
      }

      if (!isCustomerLoggedIn) {
        setIsLoading(false);
        return;
      }

      try {
        // Build the full URL to our app's API (not relative path)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

        // Pass all App Proxy parameters for verification
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
          params.append(key, value);
        });

        const response = await fetch(
          `${appUrl}/api/proxy/customer?${params.toString()}`
        );
        const data = await response.json();

        if (data.isLoggedIn && data.customer) {
          setCustomer(data.customer);
        } else {
          setError(data.message || "Could not load customer data");
        }
      } catch (err) {
        console.error("Failed to fetch customer data:", err);
        setError("Failed to load customer data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCustomerData();
  }, [isAppProxy, isCustomerLoggedIn, searchParams]);

  // Still loading
  if (isLoading) {
    return <LoadingState />;
  }

  // Not from App Proxy - show instructions
  if (!isAppProxy) {
    return (
      <>
        <div className="pattern-bg" />
        <div className="login-page">
          <div className="login-card" style={{ maxWidth: "500px" }}>
            <div className="login-header">
              <div className="login-logo">📍</div>
              <h1 className="login-title">Access via Store</h1>
              <p className="login-subtitle">
                Please access the dashboard through your store.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>
                Go to your store and access:
              </p>
              <code
                style={{
                  display: "block",
                  padding: "1rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  wordBreak: "break-all",
                }}
              >
                https://your-store.myshopify.com/apps/dashboard
              </code>
            </div>
          </div>
        </div>
      </>
    );
  }

  // App Proxy request but customer not logged in
  if (!isCustomerLoggedIn) {
    return <NotLoggedIn shop={shop} />;
  }

  // Customer logged in but data not loaded
  if (!customer) {
    return (
      <>
        <div className="pattern-bg" />
        <div className="login-page">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">⚠️</div>
              <h1 className="login-title">Setup Required</h1>
              <p className="login-subtitle">
                {error || "Admin API token not configured"}
              </p>
            </div>

            <div style={{ textAlign: "left", fontSize: "0.875rem" }}>
              <p style={{ marginBottom: "1rem" }}>
                <strong>Customer ID detected:</strong> {loggedInCustomerId}
              </p>
              <p style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>
                To display full customer data, configure the Admin API token.
              </p>

              <h4 style={{ marginBottom: "0.5rem" }}>Required in Amplify:</h4>
              <code
                style={{
                  display: "block",
                  padding: "0.75rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                }}
              >
                SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxx
              </code>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Success - show dashboard
  return (
    <>
      <div className="pattern-bg" />
      <Dashboard
        customer={customer}
        onLogout={() => {
          // Redirect to store logout
          window.location.href = `https://${shop}/account/logout`;
        }}
        authMode="proxy"
      />
    </>
  );
}

// Main page with Suspense
export default function Home() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeContent />
    </Suspense>
  );
}
