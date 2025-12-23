# Shopify Customer Dashboard - Classic Accounts

A customer-facing dashboard that integrates with Shopify's **Classic Customer Accounts** for authentication.

## 🎯 Two Authentication Options

### Option 1: Standalone with Customer Login
Customers log in with their email/password (same credentials as your store).

### Option 2: App Proxy (Shared Session) ⭐ Recommended
Customers access via your storefront URL and are **automatically recognized** if already logged in.

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

```bash
cp env.example .env.local
```

---

## Option 1: Standalone Customer Login

This is the simplest setup. Customers visit your dashboard directly and log in with their store credentials.

### Setup

1. **Create a Storefront API Token:**
   - Go to Shopify Admin → Settings → Apps and sales channels → Develop apps
   - Create an app with Storefront API access
   - Enable scopes: `unauthenticated_read_customers`, `unauthenticated_write_customers`

2. **Configure `.env.local`:**
   ```env
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
   SESSION_SECRET=generate-a-32-char-random-string
   ```

3. **Run:**
   ```bash
   npm run dev
   ```

4. **Test:**
   - Open http://localhost:3000
   - Log in with a customer account from your store

---

## Option 2: App Proxy (Shared Session)

Customers access the dashboard via `https://your-store.com/apps/dashboard` and are automatically recognized if logged in to your store. **No separate login required!**

### Step 1: Create a Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create a new app (or use existing)
3. Note your **API key** and **API secret key**

### Step 2: Configure App URLs

In your app settings:

| Setting | Value |
|---------|-------|
| App URL | `http://localhost:3000` (dev) or your production URL |
| Allowed redirection URLs | `http://localhost:3000/api/auth/callback` |

### Step 3: Add App Proxy

In your app settings → App proxy:

| Setting | Value |
|---------|-------|
| Subpath prefix | `apps` |
| Subpath | `dashboard` |
| Proxy URL | `http://localhost:3000` |

This creates: `https://your-store.myshopify.com/apps/dashboard`

### Step 4: Configure Environment

```env
# App credentials
SHOPIFY_API_KEY=your-app-api-key
SHOPIFY_API_SECRET=your-app-api-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Storefront API (for fallback login)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
SESSION_SECRET=generate-a-32-char-random-string
```

### Step 5: Install the App

1. Install your app on your development store
2. The OAuth callback will log the Admin API access token
3. Add it to `.env.local`:
   ```env
   SHOPIFY_ADMIN_ACCESS_TOKEN=the-token-from-console
   ```

### Step 6: Test

1. Log in as a customer on your Shopify store
2. Visit: `https://your-store.myshopify.com/apps/dashboard`
3. You should be automatically recognized!

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts  # OAuth callback
│   │   │   ├── login/route.ts     # Customer login
│   │   │   ├── logout/route.ts    # Customer logout
│   │   │   └── session/route.ts   # Check session
│   │   └── proxy/
│   │       └── customer/route.ts  # App Proxy endpoint
│   ├── install/page.tsx           # App installation
│   ├── page.tsx                   # Main dashboard
│   └── globals.css
├── components/
│   ├── Dashboard.tsx
│   └── LoginForm.tsx
├── lib/
│   ├── session.ts
│   └── shopify/
│       ├── admin-api.ts           # Admin API client
│       ├── client.ts              # Storefront API client
│       ├── config.ts
│       ├── verify.ts              # HMAC verification
│       └── graphql/
```

---

## 🔐 How Authentication Works

### Standalone Mode
```
Customer → Login Form → Storefront API → Access Token → Session Cookie
```

### App Proxy Mode
```
Customer (logged in on store) → App Proxy URL
     ↓
Shopify adds: logged_in_customer_id + signature
     ↓
Dashboard verifies signature → Fetches customer via Admin API
```

---

## 🛠 Troubleshooting

### "Shopify redirects to localhost with hmac/shop params"

This means you're accessing from Shopify Admin, not the App Proxy. 

**For customers to use the dashboard:**
- They should visit: `https://your-store.myshopify.com/apps/dashboard`
- NOT: `http://localhost:3000`

### "Customer not recognized via App Proxy"

1. Ensure customer is logged in on your storefront first
2. Verify App Proxy is configured correctly
3. Check that `SHOPIFY_ADMIN_ACCESS_TOKEN` is set

### "Invalid signature" errors

- Ensure `SHOPIFY_API_SECRET` is set correctly
- In development, signature verification is skipped

---

## 🔗 Useful Links

- [Shopify App Proxy Documentation](https://shopify.dev/docs/apps/online-store/app-proxies)
- [Storefront API Authentication](https://shopify.dev/docs/api/storefront#authentication)
- [Customer Access Tokens](https://shopify.dev/docs/api/storefront/current/mutations/customerAccessTokenCreate)
