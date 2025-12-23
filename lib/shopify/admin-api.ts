/**
 * Shopify Admin API Client
 * 
 * Used for fetching customer data by ID (from App Proxy)
 * when we don't have a customer access token.
 */

export interface AdminCustomer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  ordersCount: string;
  phone: string | null;
  createdAt: string;
}

const ADMIN_API_VERSION = '2024-01';

/**
 * Get customer by ID using Admin API
 * Used when customer is identified via App Proxy
 */
export async function getCustomerById(
  shop: string,
  accessToken: string,
  customerId: string
): Promise<AdminCustomer | null> {
  const query = `
    query getCustomer($id: ID!) {
      customer(id: $id) {
        id
        email
        firstName
        lastName
        displayName
        ordersCount
        phone
        createdAt
      }
    }
  `;

  try {
    const response = await fetch(
      `https://${shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          query,
          variables: { id: `gid://shopify/Customer/${customerId}` },
        }),
      }
    );

    if (!response.ok) {
      console.error('Admin API error:', response.statusText);
      return null;
    }

    const json = await response.json();
    
    if (json.errors) {
      console.error('GraphQL errors:', json.errors);
      return null;
    }

    return json.data?.customer || null;
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return null;
  }
}

