import * as dotenv from 'dotenv';
import { GloriaFoodClient, GloriaFoodOrder } from './gloriafood-client';
import { OrderDatabase, Order } from './database';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

interface AppConfig {
  apiKey: string;
  storeId: string;
  apiUrl?: string;
  masterKey?: string;
  databasePath: string;
  pollIntervalMs: number;
}

class GloriaFoodOrderFetcher {
  private client: GloriaFoodClient;
  private database: OrderDatabase;
  private config: AppConfig;
  private pollInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(config: AppConfig) {
    this.config = config;
    this.client = new GloriaFoodClient({
      apiKey: config.apiKey,
      storeId: config.storeId,
      apiUrl: config.apiUrl,
      masterKey: config.masterKey,
    });
    this.database = new OrderDatabase(config.databasePath);
  }

  async start(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 GloriaFood Order Fetcher Started\n'));
    
    // Display configuration (masking sensitive data)
    console.log(chalk.gray('Configuration:'));
    console.log(chalk.gray(`  Store ID: ${this.config.storeId}`));
    console.log(chalk.gray(`  API URL: ${this.config.apiUrl || 'https://api.gloriafood.com'}`));
    console.log(chalk.gray(`  Database: ${this.config.databasePath}`));
    console.log(chalk.gray(`  Poll Interval: ${this.config.pollIntervalMs / 1000}s\n`));

    // Initial fetch
    await this.fetchAndStoreOrders();

    // Start polling
    this.isRunning = true;
    this.pollInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.fetchAndStoreOrders();
      }
    }, this.config.pollIntervalMs);

    console.log(chalk.green('✅ Polling started. Press Ctrl+C to stop.\n'));
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.database.close();
    console.log(chalk.yellow('\n\n🛑 Stopped fetching orders. Goodbye!\n'));
  }

  async fetchAndStoreOrders(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      console.log(chalk.cyan(`\n[${timestamp}] Fetching orders...`));

      // Fetch orders from GloriaFood
      const orders = await this.client.fetchOrders(50);
      
      if (orders.length === 0) {
        console.log(chalk.gray('  No new orders found.'));
        this.displayStats();
        return;
      }

      console.log(chalk.green(`  Found ${orders.length} order(s)`));

      // Store orders in database
      let newCount = 0;
      let updatedCount = 0;

      for (const order of orders) {
        const existing = this.database.getOrderByGloriaFoodId(order.id?.toString() || '');
        const saved = this.database.insertOrUpdateOrder(order);

        if (saved) {
          if (existing) {
            updatedCount++;
          } else {
            newCount++;
            this.displayOrder(saved, true);
          }
        }
      }

      if (newCount > 0 || updatedCount > 0) {
        console.log(chalk.green(`  ✓ Stored: ${newCount} new, ${updatedCount} updated`));
      }

      this.displayStats();
    } catch (error: any) {
      console.error(chalk.red(`  ✗ Error fetching orders: ${error.message}`));
      
      // Show helpful error message
      if (error.message.includes('401') || error.message.includes('403')) {
        console.error(chalk.yellow('  ⚠ Check your API credentials in .env file'));
        console.error(chalk.yellow('  ⚠ Your API may only support webhooks. Try: npm run webhook'));
      } else if (error.message.includes('404') || error.message.includes('webhooks')) {
        console.error(chalk.yellow('  ⚠ API endpoint not found. Your GloriaFood may only support webhooks.'));
        console.error(chalk.green('  → Use webhook mode instead: npm run webhook'));
        console.error(chalk.gray('  → Configure GloriaFood webhook to: https://tekmaxllc.com/webhook'));
      } else if (error.message.includes('timeout')) {
        console.error(chalk.yellow('  ⚠ Request timeout. Check your internet connection'));
      } else {
        console.error(chalk.yellow('  💡 Tip: Your setup uses webhooks (https://tekmaxllc.com/webhook)'));
        console.error(chalk.green('  → Try webhook mode: npm run webhook'));
      }
    }
  }

  displayOrder(order: Order, isNew: boolean = false): void {
    const prefix = isNew ? chalk.green('🆕 NEW ORDER') : chalk.blue('📦 ORDER');
    
    console.log(`\n${prefix} ${chalk.bold(`#${order.gloriafood_order_id}`)}`);
    console.log(chalk.gray('  ──────────────────────────────────────────'));
    console.log(`  ${chalk.bold('Customer:')} ${order.customer_name}`);
    
    if (order.customer_phone) {
      console.log(`  ${chalk.bold('Phone:')} ${order.customer_phone}`);
    }
    
    if (order.customer_email) {
      console.log(`  ${chalk.bold('Email:')} ${order.customer_email}`);
    }

    if (order.delivery_address) {
      console.log(`  ${chalk.bold('Delivery Address:')} ${order.delivery_address}`);
    }

    // Convert total_price to number (MySQL returns DECIMAL as string)
    const totalPrice = typeof order.total_price === 'string' 
      ? parseFloat(order.total_price) 
      : (order.total_price || 0);
    console.log(`  ${chalk.bold('Total:')} ${order.currency} ${totalPrice.toFixed(2)}`);
    console.log(`  ${chalk.bold('Status:')} ${this.formatStatus(order.status)}`);
    console.log(`  ${chalk.bold('Type:')} ${order.order_type}`);
    console.log(`  ${chalk.bold('Fetched:')} ${new Date(order.fetched_at).toLocaleString()}`);
    
    // Display items
    try {
      const items = JSON.parse(order.items);
      if (Array.isArray(items) && items.length > 0) {
        console.log(`  ${chalk.bold('Items:')}`);
        items.forEach((item: any, index: number) => {
          const name = item.name || item.product_name || item.title || 'Unknown Item';
          const quantity = item.quantity || 1;
          const price = item.price || item.unit_price || 0;
          console.log(`    ${index + 1}. ${name} x${quantity} - ${order.currency} ${price}`);
        });
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    console.log(chalk.gray('  ──────────────────────────────────────────'));
  }

  formatStatus(status: string): string {
    const statusColors: { [key: string]: chalk.Chalk } = {
      'accepted': chalk.green,
      'pending': chalk.yellow,
      'preparing': chalk.cyan,
      'ready': chalk.blue,
      'completed': chalk.green,
      'cancelled': chalk.red,
      'rejected': chalk.red,
    };

    const lowerStatus = status.toLowerCase();
    const colorizer = statusColors[lowerStatus] || chalk.white;
    return colorizer(status.toUpperCase());
  }

  displayStats(): void {
    const totalOrders = this.database.getOrderCount();
    const recentOrders = this.database.getRecentOrders(60);
    
    console.log(chalk.gray(`\n  📊 Total Orders: ${totalOrders} | Recent (1h): ${recentOrders.length}`));
  }

  displayAllOrders(): void {
    const orders = this.database.getAllOrders(20);
    
    console.log(chalk.blue.bold('\n\n📋 Recent Orders in Database:\n'));
    
    if (orders.length === 0) {
      console.log(chalk.gray('  No orders found in database.'));
      return;
    }

    orders.forEach(order => {
      this.displayOrder(order, false);
    });
  }
}

// Main execution
async function main() {
  // Validate environment variables
  const apiKey = process.env.GLORIAFOOD_API_KEY;
  const storeId = process.env.GLORIAFOOD_STORE_ID;

  if (!apiKey || !storeId) {
    console.error(chalk.red.bold('\n❌ Error: Missing required environment variables!\n'));
    console.error(chalk.yellow('Please create a .env file with the following variables:'));
    console.error(chalk.gray('  GLORIAFOOD_API_KEY=your_api_key'));
    console.error(chalk.gray('  GLORIAFOOD_STORE_ID=your_store_id'));
    console.error(chalk.gray('  GLORIAFOOD_API_URL=https://api.gloriafood.com (optional)'));
    console.error(chalk.gray('  GLORIAFOOD_MASTER_KEY=your_master_key (optional)'));
    console.error(chalk.gray('  DATABASE_PATH=./orders.db (optional)'));
    console.error(chalk.gray('  POLL_INTERVAL_MS=30000 (optional)\n'));
    process.exit(1);
  }

  const config: AppConfig = {
    apiKey,
    storeId,
    apiUrl: process.env.GLORIAFOOD_API_URL,
    masterKey: process.env.GLORIAFOOD_MASTER_KEY,
    databasePath: process.env.DATABASE_PATH || './orders.db',
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '30000', 10),
  };

  const fetcher = new GloriaFoodOrderFetcher(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await fetcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await fetcher.stop();
    process.exit(0);
  });

  // Start fetching
  await fetcher.start();
}

// Run the application
main().catch(error => {
  console.error(chalk.red.bold('\n❌ Fatal Error:'), error);
  process.exit(1);
});

