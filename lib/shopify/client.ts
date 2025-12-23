/**
 * Shopify Storefront API Client
 * 
 * This client handles all communication with Shopify's Storefront API
 * for customer authentication and data retrieval.
 */

import { getStorefrontApiUrl, getStorefrontHeaders } from './config';
import { 
  CUSTOMER_ACCESS_TOKEN_CREATE, 
  CUSTOMER_ACCESS_TOKEN_DELETE,
  CUSTOMER_ACCESS_TOKEN_RENEW 
} from './graphql/mutations';
import { CUSTOMER_QUERY, CUSTOMER_ORDERS_QUERY } from './graphql/queries';

// Type definitions
export interface CustomerAccessToken {
  accessToken: string;
  expiresAt: string;
}

export interface CustomerAddress {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  provinceCode: string | null;
  zip: string | null;
  country: string | null;
  countryCodeV2: string | null;
  phone: string | null;
}

export interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string;
  phone: string | null;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
  numberOfOrders: string;
  defaultAddress: CustomerAddress | null;
  addresses: {
    edges: Array<{ node: CustomerAddress }>;
  };
}

export interface Order {
  id: string;
  orderNumber: number;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  currentTotalPrice: {
    amount: string;
    currencyCode: string;
  };
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: {
          image: {
            url: string;
            altText: string | null;
          } | null;
        } | null;
      };
    }>;
  };
}

export interface CustomerUserError {
  code: string;
  field: string[];
  message: string;
}

// Generic GraphQL request function
async function storefrontFetch<T>(
  query: string, 
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(getStorefrontApiUrl(), {
    method: 'POST',
    headers: getStorefrontHeaders(),
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API request failed: ${response.statusText}`);
  }

  const json = await response.json();
  
  if (json.errors) {
    console.error('GraphQL Errors:', json.errors);
    throw new Error(json.errors[0]?.message || 'GraphQL request failed');
  }

  return json.data;
}

/**
 * Authenticate a customer with email and password
 * Returns a customer access token on success
 */
export async function loginCustomer(
  email: string, 
  password: string
): Promise<{ token: CustomerAccessToken | null; errors: CustomerUserError[] }> {
  const data = await storefrontFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: CustomerAccessToken | null;
      customerUserErrors: CustomerUserError[];
    };
  }>(CUSTOMER_ACCESS_TOKEN_CREATE, {
    input: { email, password },
  });

  const { customerAccessToken, customerUserErrors } = data.customerAccessTokenCreate;

  return {
    token: customerAccessToken,
    errors: customerUserErrors,
  };
}

/**
 * Log out a customer by deleting their access token
 */
export async function logoutCustomer(accessToken: string): Promise<boolean> {
  try {
    await storefrontFetch(CUSTOMER_ACCESS_TOKEN_DELETE, {
      customerAccessToken: accessToken,
    });
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

/**
 * Renew a customer access token
 */
export async function renewAccessToken(
  accessToken: string
): Promise<CustomerAccessToken | null> {
  try {
    const data = await storefrontFetch<{
      customerAccessTokenRenew: {
        customerAccessToken: CustomerAccessToken | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(CUSTOMER_ACCESS_TOKEN_RENEW, {
      customerAccessToken: accessToken,
    });

    return data.customerAccessTokenRenew.customerAccessToken;
  } catch (error) {
    console.error('Token renewal error:', error);
    return null;
  }
}

/**
 * Fetch the authenticated customer's profile
 */
export async function getCustomer(accessToken: string): Promise<Customer | null> {
  try {
    const data = await storefrontFetch<{ customer: Customer | null }>(
      CUSTOMER_QUERY,
      { customerAccessToken: accessToken }
    );
    return data.customer;
  } catch (error) {
    console.error('Get customer error:', error);
    return null;
  }
}

/**
 * Fetch the customer's orders
 */
export async function getCustomerOrders(
  accessToken: string, 
  first: number = 10
): Promise<Order[]> {
  try {
    const data = await storefrontFetch<{
      customer: {
        orders: {
          edges: Array<{ node: Order }>;
        };
      } | null;
    }>(CUSTOMER_ORDERS_QUERY, {
      customerAccessToken: accessToken,
      first,
    });

    return data.customer?.orders.edges.map(edge => edge.node) || [];
  } catch (error) {
    console.error('Get orders error:', error);
    return [];
  }
}

