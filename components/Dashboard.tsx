'use client';

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string;
  numberOfOrders: string;
}

interface DashboardProps {
  customer: Customer;
  onLogout: () => void;
  authMode?: 'session' | 'proxy' | 'login';
}

export function Dashboard({ customer, onLogout, authMode = 'session' }: DashboardProps) {
  const initials = customer.displayName
    ? customer.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const firstName = customer.firstName || customer.displayName?.split(' ')[0] || 'Customer';

  const authModeLabel = {
    session: 'Storefront API Session',
    proxy: 'App Proxy (Shared Session)',
    login: 'Customer Login',
  }[authMode];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container header-content">
          <div className="header-logo">
            <div className="header-logo-icon">✦</div>
            <span className="header-brand">Customer Portal</span>
          </div>
          
          <nav className="header-nav">
            <div className="user-badge">
              <div className="user-avatar">{initials}</div>
              <span className="user-name">{customer.displayName || customer.email}</span>
            </div>
            {authMode !== 'proxy' && (
              <button className="btn btn-secondary" onClick={onLogout}>
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          <section className="welcome-section">
            <h1 className="welcome-title">
              Hello, {firstName}! 👋
            </h1>
            <p className="welcome-subtitle">
              Welcome to your personal dashboard. Here you can view your account details and order history.
            </p>
          </section>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{customer.numberOfOrders || '0'}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">✓</div>
              <div className="stat-value">
                <span className="success-badge">Active</span>
              </div>
              <div className="stat-label">Account Status</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🔐</div>
              <div className="stat-value">
                <span className="success-badge">Verified</span>
              </div>
              <div className="stat-label">Email Status</div>
            </div>
          </div>

          <section className="info-section">
            <div className="info-header">
              <span style={{ fontSize: '1.25rem' }}>👤</span>
              <h2 className="info-title">Account Information</h2>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Full Name</div>
                <div className="info-value">{customer.displayName || 'Not set'}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Email Address</div>
                <div className="info-value">{customer.email || 'Not available'}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Customer ID</div>
                <div className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {customer.id?.replace('gid://shopify/Customer/', '') || customer.id}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Orders Placed</div>
                <div className="info-value">{customer.numberOfOrders || '0'} orders</div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="dashboard-footer">
        <div className="container">
          <p>
            🔒 Authentication: <strong>{authModeLabel}</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
