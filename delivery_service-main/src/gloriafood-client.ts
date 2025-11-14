import axios, { AxiosInstance } from 'axios';

export interface GloriaFoodConfig {
  apiKey: string;
  storeId: string;
  apiUrl?: string;
  masterKey?: string;
}

export interface GloriaFoodOrder {
  id: string;
  store_id?: string;
  restaurant_id?: string;
  client?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  delivery?: {
    address?: {
      street?: string;
      address_line_1?: string;
      city?: string;
      state?: string;
      zip?: string;
      postal_code?: string;
      country?: string;
    };
  };
  total_price?: number | string;
  total?: number | string;
  currency?: string;
  status?: string;
  order_status?: string;
  order_type?: string;
  type?: string;
  items?: any[];
  order_items?: any[];
  created_at?: string;
  order_date?: string;
  [key: string]: any;
}

export class GloriaFoodClient {
  private axiosInstance: AxiosInstance;
  private config: GloriaFoodConfig;

  constructor(config: GloriaFoodConfig) {
    this.config = config;
    // GloriaFood API is often on the restaurant's own domain or a custom webhook URL
    // Default URL may not be correct - user should provide their actual API URL from GloriaFood dashboard
    const baseURL = config.apiUrl || 'https://api.gloriafood.com';

    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...(config.masterKey && { 'X-Master-Key': config.masterKey }),
        ...(config.masterKey && { 'Master-Key': config.masterKey }),
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...(config.storeId && { 'X-Restaurant-ID': config.storeId }),
      },
      timeout: 30000,
    });
  }

  /**
   * Helper method to handle network errors with better messages
   */
  private handleNetworkError(error: any, operation: string): never {
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      const baseURL = this.config.apiUrl || 'https://api.gloriafood.com';
      const hostname = baseURL.split('://')[1]?.split('/')[0] || baseURL;
      throw new Error(
        `DNS Error: Cannot resolve hostname "${hostname}". ` +
        `Please check:\n` +
        `  1. Your internet connection\n` +
        `  2. The GLORIAFOOD_API_URL in your .env file (current: ${baseURL})\n` +
        `  3. GloriaFood API often uses webhook URLs from your restaurant domain, not api.gloriafood.com\n` +
        `  4. Check your GloriaFood dashboard (Settings → Integrations) for the correct API/webhook URL\n` +
        `  Original error: ${error.message}`
      );
    }
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Connection Refused: Cannot connect to API. Check if the API URL is correct and the service is running.\n` +
        `  API URL: ${this.config.apiUrl || 'https://api.gloriafood.com'}\n` +
        `  Operation: ${operation}\n` +
        `  Original error: ${error.message}`
      );
    }
    
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      throw new Error(
        `Request Timeout: API did not respond in time. Check your internet connection or API status.\n` +
        `  Operation: ${operation}\n` +
        `  Original error: ${error.message}`
      );
    }

    if (error.response) {
      throw new Error(
        `GloriaFood API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    }
    
    throw error;
  }

  /**
   * Fetch orders from GloriaFood API
   * Note: The actual endpoint structure may vary based on your GloriaFood account
   */
  async fetchOrders(limit: number = 50, status?: string): Promise<GloriaFoodOrder[]> {
    try {
      // Common API endpoint patterns for GloriaFood
      // Adjust based on your specific API documentation
      const params: any = {
        restaurant_id: this.config.storeId,
        limit,
      };

      if (status) {
        params.status = status;
      }

      // Try different endpoint variations
      // For custom domains like tekmaxllc.com, try these paths:
      const endpoints = [
        `/api/v2/restaurants/${this.config.storeId}/orders`,
        `/api/v2/orders`,
        `/api/v1/restaurants/${this.config.storeId}/orders`,
        `/api/v1/orders`,
        `/api/restaurants/${this.config.storeId}/orders`,
        `/api/orders`,
        `/orders`,
        `/webhook/orders`,  // Some custom setups use this
        `/api/webhook/orders`,  // Alternative webhook polling
        `/restaurants/${this.config.storeId}/orders`,  // Alternative format
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.axiosInstance.get(endpoint, { params });
          
          // Handle different response structures
          if (response.data.orders) {
            return response.data.orders;
          }
          if (response.data.data) {
            return response.data.data;
          }
          if (Array.isArray(response.data)) {
            return response.data;
          }
          if (response.data) {
            return [response.data];
          }
        } catch (error: any) {
          // If not 404, rethrow (might be auth error, etc.)
          if (error.response?.status !== 404 && error.code !== 'ENOTFOUND') {
            throw error;
          }
        }
      }

      throw new Error('Unable to fetch orders from any endpoint. Your API may only support webhooks, not polling. Try using webhook mode instead (npm run webhook).');
    } catch (error: any) {
      this.handleNetworkError(error, 'fetchOrders');
      return []; // This won't be reached, but satisfies TypeScript
    }
  }

  /**
   * Fetch a specific order by ID
   */
  async fetchOrderById(orderId: string): Promise<GloriaFoodOrder | null> {
    try {
      const endpoints = [
        `/api/v2/restaurants/${this.config.storeId}/orders/${orderId}`,
        `/api/v1/orders/${orderId}`,
        `/api/orders/${orderId}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.axiosInstance.get(endpoint);
          
          if (response.data.order) {
            return response.data.order;
          }
          if (response.data.data) {
            return response.data.data;
          }
          if (response.data) {
            return response.data;
          }
        } catch (error: any) {
          if (error.response?.status !== 404) {
            throw error;
          }
        }
      }

      return null;
    } catch (error: any) {
      this.handleNetworkError(error, `fetchOrderById(${orderId})`);
      return null; // This won't be reached, but satisfies TypeScript
    }
  }

  /**
   * Fetch new orders since a given timestamp
   */
  async fetchOrdersSince(timestamp: string, limit: number = 100): Promise<GloriaFoodOrder[]> {
    try {
      const params: any = {
        restaurant_id: this.config.storeId,
        since: timestamp,
        limit,
      };

      const endpoints = [
        `/api/v2/restaurants/${this.config.storeId}/orders`,
        `/api/v1/orders`,
        `/api/orders`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.axiosInstance.get(endpoint, { params });
          
          if (response.data.orders) {
            return response.data.orders;
          }
          if (response.data.data) {
            return response.data.data;
          }
          if (Array.isArray(response.data)) {
            return response.data;
          }
        } catch (error: any) {
          if (error.response?.status !== 404) {
            throw error;
          }
        }
      }

      return [];
    } catch (error: any) {
      this.handleNetworkError(error, 'fetchOrdersSince');
      return []; // This won't be reached, but satisfies TypeScript
    }
  }
}

