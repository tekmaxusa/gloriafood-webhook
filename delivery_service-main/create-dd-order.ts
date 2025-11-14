import * as dotenv from 'dotenv';
import { DatabaseFactory } from './src/database-factory';
import { DoorDashClient } from './src/doordash-client';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

async function createDoorDashOrder() {
  const args = process.argv.slice(2);
  const orderId = args[0];

  if (!orderId) {
    console.error(chalk.red('\n❌ Pakispecify ang GloriaFood Order ID'));
    console.log(chalk.yellow('\nUsage: npm run create-dd <order-id>'));
    console.log(chalk.gray('Example: npm run create-dd 1108600163\n'));
    process.exit(1);
  }

  console.log(chalk.blue.bold('\n🚚 Gumagawa ng DoorDash Order (Sandbox Mode)\n'));

  // Check DoorDash credentials
  const developerId = process.env.DOORDASH_DEVELOPER_ID || '';
  const keyId = process.env.DOORDASH_KEY_ID || '';
  const signingSecret = process.env.DOORDASH_SIGNING_SECRET || '';
  const apiUrl = process.env.DOORDASH_API_URL;
  const isSandbox = process.env.DOORDASH_SANDBOX === 'true';

  if (!developerId || !keyId || !signingSecret) {
    console.error(chalk.red('\n❌ Missing DoorDash credentials sa .env'));
    console.log(chalk.yellow('Kailangan:'));
    console.log(chalk.gray('  DOORDASH_DEVELOPER_ID=your_developer_id'));
    console.log(chalk.gray('  DOORDASH_KEY_ID=your_key_id'));
    console.log(chalk.gray('  DOORDASH_SIGNING_SECRET=your_signing_secret'));
    console.log(chalk.gray('  DOORDASH_SANDBOX=true (para sa sandbox testing)\n'));
    process.exit(1);
  }

  console.log(chalk.gray('Configuration:'));
  console.log(chalk.gray(`  Mode: ${isSandbox ? chalk.yellow('SANDBOX (Testing)') : chalk.green('PRODUCTION')}`));
  console.log(chalk.gray(`  Developer ID: ${developerId.substring(0, 8)}...\n`));

  // Initialize DoorDash client
  const ddClient = new DoorDashClient({
    developerId,
    keyId,
    signingSecret,
    apiUrl,
    isSandbox,
  });

  // Test connection first
  try {
    console.log(chalk.cyan('🔍 Testing DoorDash connection...'));
    await ddClient.testConnection();
    console.log(chalk.green('✅ Connection successful!\n'));
  } catch (error: any) {
    console.error(chalk.red(`❌ Connection test failed: ${error.message}\n`));
    process.exit(1);
  }

  // Get order from database
  const database = DatabaseFactory.createDatabase();
  const order = await (database.getOrderByGloriaFoodId instanceof Promise
    ? database.getOrderByGloriaFoodId(orderId)
    : Promise.resolve(database.getOrderByGloriaFoodId(orderId)));

  if (!order) {
    console.error(chalk.red(`❌ Order not found: ${orderId}`));
    console.log(chalk.yellow('Make sure the order exists sa database.\n'));
    process.exit(1);
  }

  console.log(chalk.cyan(`📦 Found order: ${order.gloriafood_order_id}`));
  console.log(chalk.gray(`   Customer: ${order.customer_name}`));
  console.log(chalk.gray(`   Status: ${order.status}\n`));

  // Parse raw_data for conversion
  let rawData: any = null;
  try {
    rawData = JSON.parse(order.raw_data || '{}');
  } catch (e) {
    console.error(chalk.red('❌ Error parsing order raw_data'));
    process.exit(1);
  }

  if (!rawData || Object.keys(rawData).length === 0) {
    console.error(chalk.red('❌ Order has no raw_data. Order may need to be received via webhook first.'));
    process.exit(1);
  }

  // Check if order is delivery type
  const orderType = rawData.type || rawData.order_type || order.order_type || '';
  if (orderType.toLowerCase() !== 'delivery') {
    console.error(chalk.yellow(`⚠️  Warning: Order type is "${orderType}", not "delivery"`));
    console.log(chalk.yellow('DoorDash only handles delivery orders.\n'));
  }

  try {
    // Convert to DoorDash Drive format
    console.log(chalk.cyan('🔄 Converting order to DoorDash format...'));
    const drivePayload = ddClient.convertGloriaFoodToDrive(rawData);
    
    // Add timestamp to external_delivery_id to avoid duplicates when testing
    // This allows testing the same order multiple times in sandbox
    const timestamp = Date.now();
    drivePayload.external_delivery_id = `${orderId}-test-${timestamp}`;
    console.log(chalk.gray(`   Using unique external_delivery_id: ${drivePayload.external_delivery_id}`));

    console.log(chalk.gray('\n📋 DoorDash Delivery Payload:'));
    console.log(chalk.gray(JSON.stringify(drivePayload, null, 2)));

    // Create DoorDash delivery (calls driver)
    console.log(chalk.cyan('\n🚚 Creating DoorDash delivery (calling driver)...'));
    const response = await ddClient.createDriveDelivery(drivePayload);

    console.log(chalk.green('\n✅ DoorDash order created successfully!\n'));
    console.log(chalk.bold('📊 Delivery Details:'));
    console.log(`   ${chalk.bold('DoorDash Delivery ID:')} ${response.id || 'N/A'}`);
    console.log(`   ${chalk.bold('External Delivery ID:')} ${response.external_delivery_id || drivePayload.external_delivery_id}`);
    console.log(`   ${chalk.bold('Status:')} ${chalk.magenta(response.status || 'N/A')}`);
    
    if (response.tracking_url) {
      console.log(`   ${chalk.bold('Tracking URL:')} ${chalk.blue(response.tracking_url)}`);
    }

    // Mark order as sent to DoorDash in database
    const dbAny = database as any;
    if (typeof dbAny.markOrderSentToDoorDash === 'function') {
      try {
        const markResult = dbAny.markOrderSentToDoorDash(orderId, response.id);
        if (markResult instanceof Promise) {
          await markResult;
        }
        console.log(chalk.green(`   ✅ Order marked as sent to DoorDash in database`));
      } catch (e) {
        console.log(chalk.yellow(`   ⚠️  Could not update database: ${(e as Error).message}`));
      }
    }

    // Show raw response if available
    if ((response as any).raw) {
      console.log(chalk.gray('\n📄 Raw Response:'));
      console.log(chalk.gray(JSON.stringify((response as any).raw, null, 2)));
    }

    console.log(chalk.green('\n✅ Done! Driver has been notified via DoorDash.\n'));

    // If sandbox, show note
    if (isSandbox) {
      console.log(chalk.yellow('ℹ️  Note: This is a SANDBOX order (test mode)'));
      console.log(chalk.yellow('   No actual driver will be dispatched.\n'));
    }

  } catch (error: any) {
    console.error(chalk.red(`\n❌ Failed to create DoorDash order: ${error.message}`));
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log(chalk.yellow('\n💡 Check your DoorDash credentials:'));
      console.log(chalk.gray('   - Verify Developer ID, Key ID, and Signing Secret are correct'));
      console.log(chalk.gray('   - Ensure credentials match the environment (sandbox vs production)'));
    } else if (error.message.includes('404')) {
      console.log(chalk.yellow('\n💡 API endpoint not found:'));
      console.log(chalk.gray('   - Check if you\'re using the correct API URL'));
      console.log(chalk.gray('   - Verify sandbox vs production settings'));
    } else if (error.message.includes('400')) {
      console.log(chalk.yellow('\n💡 Invalid request payload:'));
      console.log(chalk.gray('   - Check if order has required fields (pickup/dropoff addresses, phone numbers)'));
      console.log(chalk.gray('   - Verify order data is complete'));
    } else if (error.message.includes('409')) {
      console.log(chalk.yellow('\n💡 Duplicate delivery ID:'));
      console.log(chalk.gray('   - This order has already been sent to DoorDash'));
      console.log(chalk.gray('   - Use a different order ID or check existing deliveries'));
    }

    console.log('');
    process.exit(1);
  } finally {
    const closeResult = database.close();
    if (closeResult instanceof Promise) {
      await closeResult;
    }
  }
}

// Run the script
createDoorDashOrder().catch(error => {
  console.error(chalk.red.bold('\n❌ Fatal Error:'), error);
  process.exit(1);
});

