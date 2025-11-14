import * as dotenv from 'dotenv';
import { DatabaseFactory, Order } from './src/database-factory';
import { DoorDashClient } from './src/doordash-client';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

const database = DatabaseFactory.createDatabase();

// Helper function to handle both sync and async database results
async function handleAsync<T>(result: T | Promise<T>): Promise<T> {
  return result instanceof Promise ? await result : result;
}

function displayOrder(order: Order, index?: number): void {
  const orderNum = index !== undefined ? `${index + 1}. ` : '';
  
  // Parse raw_data to extract more details
  let rawData: any = null;
  try {
    rawData = JSON.parse(order.raw_data);
  } catch (e) {
    // Ignore parsing errors
  }

  console.log(chalk.blue.bold(`\n${orderNum}📦 Order #${order.gloriafood_order_id}`));
  console.log(chalk.gray('  ════════════════════════════════════════════════════════════'));
  
  // Order Information Section
  console.log(chalk.yellow.bold('\n  📋 ORDER INFORMATION:'));
  console.log(`    ${chalk.bold('Order ID:')} ${order.gloriafood_order_id}`);
  console.log(`    ${chalk.bold('Internal ID:')} ${order.id}`);
  console.log(`    ${chalk.bold('Store ID:')} ${order.store_id || 'N/A'}`);
  console.log(`    ${chalk.bold('Status:')} ${formatStatus(order.status)}`);
  console.log(`    ${chalk.bold('Type:')} ${order.order_type || 'N/A'}`);
  // Convert total_price to number (MySQL returns DECIMAL as string)
  const totalPrice = typeof order.total_price === 'string' 
    ? parseFloat(order.total_price) 
    : (order.total_price || 0);
  console.log(`    ${chalk.bold('Total:')} ${order.currency} ${totalPrice.toFixed(2)}`);
  
  // Extract additional order details from raw_data
  if (rawData) {
    if (rawData.order_number) {
      console.log(`    ${chalk.bold('Order Number:')} ${rawData.order_number}`);
    }
    if (rawData.order_date) {
      console.log(`    ${chalk.bold('Order Date:')} ${new Date(rawData.order_date).toLocaleString()}`);
    }
    if (rawData.payment_method) {
      console.log(`    ${chalk.bold('Payment Method:')} ${rawData.payment_method}`);
    }
    if (rawData.note || rawData.notes || rawData.customer_note) {
      const note = rawData.note || rawData.notes || rawData.customer_note;
      console.log(`    ${chalk.bold('Notes:')} ${note}`);
    }
  }

  // Customer Information Section
  console.log(chalk.yellow.bold('\n  👤 CUSTOMER INFORMATION:'));
  
  // Try to extract customer info from multiple sources
  let customerName = order.customer_name;
  let customerPhone = order.customer_phone;
  let customerEmail = order.customer_email;
  
  if (rawData) {
    // Try root level client_* fields first (GloriaFood format)
    if (rawData.client_first_name || rawData.client_last_name) {
      const firstName = rawData.client_first_name || '';
      const lastName = rawData.client_last_name || '';
      customerName = `${firstName} ${lastName}`.trim() || customerName;
    }
    if (rawData.client_name && String(rawData.client_name).trim()) {
      customerName = String(rawData.client_name).trim() || customerName;
    }
    if (rawData.client_phone && String(rawData.client_phone).trim()) {
      customerPhone = String(rawData.client_phone).trim() || customerPhone;
    }
    if (rawData.client_email && String(rawData.client_email).trim()) {
      customerEmail = String(rawData.client_email).trim() || customerEmail;
    }
    
    // Try nested client object (backup)
    if (rawData.client) {
      const firstName = rawData.client.first_name || '';
      const lastName = rawData.client.last_name || '';
      if (firstName || lastName) {
        customerName = `${firstName} ${lastName}`.trim() || customerName;
      }
      if (!customerPhone && rawData.client.phone) {
        customerPhone = String(rawData.client.phone).trim();
      }
      if (!customerEmail && rawData.client.email) {
        customerEmail = String(rawData.client.email).trim();
      }
    }
    if (rawData.customer) {
      if (!customerName && (rawData.customer.name || rawData.customer.first_name)) {
        customerName = rawData.customer.name || rawData.customer.first_name || customerName;
      }
      if (!customerPhone && rawData.customer.phone) {
        customerPhone = String(rawData.customer.phone).trim();
      }
      if (!customerEmail && rawData.customer.email) {
        customerEmail = String(rawData.customer.email).trim();
      }
    }
    
    // Try other root level fields (backup)
    if (!customerName && rawData.customer_name) {
      customerName = String(rawData.customer_name).trim();
    }
    if (!customerPhone && (rawData.phone || rawData.customer_phone)) {
      customerPhone = String(rawData.phone || rawData.customer_phone).trim();
    }
    if (!customerEmail && (rawData.email || rawData.customer_email)) {
      customerEmail = String(rawData.email || rawData.customer_email).trim();
    }
  }
  
  console.log(`    ${chalk.bold('Name:')} ${customerName || 'N/A'}`);
  console.log(`    ${chalk.bold('Phone:')} ${customerPhone || 'N/A'}`);
  console.log(`    ${chalk.bold('Email:')} ${customerEmail || 'N/A'}`);

  // Delivery Information Section
  console.log(chalk.yellow.bold('\n  📍 DELIVERY INFORMATION:'));
  
  let deliveryAddress = order.delivery_address;
  if (rawData) {
    // Try root level client_address first (GloriaFood format)
    if (rawData.client_address && String(rawData.client_address).trim()) {
      deliveryAddress = String(rawData.client_address).trim();
    }
    
    // Try client_address_parts (GloriaFood structured format)
    if (!deliveryAddress && rawData.client_address_parts) {
      const parts = rawData.client_address_parts;
      const addressParts = [
        parts.street || parts.address_line_1 || parts.address,
        parts.more_address || parts.address_line_2 || parts.apt || parts.apartment,
        parts.city || parts.locality || parts.town,
        parts.state || parts.province || parts.region,
        parts.zip || parts.postal_code || parts.postcode,
        parts.country || parts.country_code
      ].filter(Boolean).map(s => String(s).trim());
      if (addressParts.length > 0) {
        deliveryAddress = addressParts.join(', ');
      }
    }
    
    // Try nested delivery.address object (backup)
    if (!deliveryAddress && rawData.delivery && rawData.delivery.address) {
      const addr = rawData.delivery.address;
      const addressParts = [
        addr.street || addr.address_line_1 || addr.address,
        addr.city || addr.locality || addr.town,
        addr.state || addr.province || addr.region,
        addr.zip || addr.postal_code || addr.postcode,
        addr.country || addr.country_code
      ].filter(Boolean).map(s => String(s).trim());
      if (addressParts.length > 0) {
        deliveryAddress = addressParts.join(', ');
      }
      // Try full_address field
      if (!deliveryAddress && addr.full_address) {
        deliveryAddress = String(addr.full_address).trim();
      }
      if (!deliveryAddress && addr.formatted_address) {
        deliveryAddress = String(addr.formatted_address).trim();
      }
    }
    
    // Try other delivery fields (backup)
    if (!deliveryAddress && rawData.delivery_address) {
      deliveryAddress = String(rawData.delivery_address).trim();
    }
    if (!deliveryAddress && rawData.address) {
      deliveryAddress = typeof rawData.address === 'string' ? rawData.address : JSON.stringify(rawData.address);
    }
    if (!deliveryAddress && rawData.shipping_address) {
      deliveryAddress = String(rawData.shipping_address).trim();
    }
    
    // Additional delivery information
    if (rawData.delivery) {
      if (rawData.delivery.phone) {
        console.log(`    ${chalk.bold('Delivery Phone:')} ${rawData.delivery.phone}`);
      }
      if (rawData.delivery.instructions) {
        console.log(`    ${chalk.bold('Delivery Instructions:')} ${rawData.delivery.instructions}`);
      }
      if (rawData.delivery.fee !== undefined) {
        console.log(`    ${chalk.bold('Delivery Fee:')} ${order.currency} ${rawData.delivery.fee}`);
      }
    }
    if (rawData.delivery_zone_name) {
      console.log(`    ${chalk.bold('Delivery Zone:')} ${rawData.delivery_zone_name}`);
    }
    if (rawData.latitude && rawData.longitude) {
      console.log(`    ${chalk.bold('Coordinates:')} ${rawData.latitude}, ${rawData.longitude}`);
    }
  }
  
  console.log(`    ${chalk.bold('Address:')} ${deliveryAddress || 'N/A'}`);

  // Items Section
  console.log(chalk.yellow.bold('\n  🛒 ORDER ITEMS:'));
  try {
    const items = JSON.parse(order.items);
    if (Array.isArray(items) && items.length > 0) {
      let itemsTotal = 0;
      items.forEach((item: any, idx: number) => {
        const name = item.name || item.product_name || item.title || item.item_name || 'Unknown Item';
        const quantity = item.quantity || 1;
        const price = parseFloat(item.price || item.unit_price || item.total_price || 0);
        const subtotal = quantity * price;
        itemsTotal += subtotal;
        
        console.log(`    ${idx + 1}. ${name}`);
        console.log(`       ${chalk.gray(`Quantity: ${quantity} × ${order.currency} ${price.toFixed(2)} = ${order.currency} ${subtotal.toFixed(2)}`)}`);
        
        if (item.variations || item.options) {
          const variations = item.variations || item.options || [];
          variations.forEach((opt: any) => {
            console.log(`       ${chalk.gray(`  - ${opt.name || opt.title || ''}`)}`);
          });
        }
        if (item.note || item.special_instructions) {
          console.log(`       ${chalk.gray(`  Note: ${item.note || item.special_instructions}`)}`);
        }
      });
      
      // Convert total_price to number for calculations
      const orderTotalPrice = typeof order.total_price === 'string' 
        ? parseFloat(order.total_price) 
        : (order.total_price || 0);
      const deliveryFee = orderTotalPrice - itemsTotal;
      if (deliveryFee > 0 && deliveryFee.toFixed(2) !== '0.00') {
        console.log(`\n    ${chalk.bold('Subtotal:')} ${order.currency} ${itemsTotal.toFixed(2)}`);
        console.log(`    ${chalk.bold('Delivery Fee:')} ${order.currency} ${deliveryFee.toFixed(2)}`);
      }
      console.log(`    ${chalk.bold('Total:')} ${order.currency} ${orderTotalPrice.toFixed(2)}`);
    } else {
      console.log(`    ${chalk.gray('No items data available')}`);
    }
  } catch (e) {
    console.log(`    ${chalk.gray('Error parsing items data')}`);
  }

  // Timestamps Section
  console.log(chalk.yellow.bold('\n  ⏰ TIMESTAMPS:'));
  console.log(`    ${chalk.bold('Created:')} ${new Date(order.created_at).toLocaleString()}`);
  console.log(`    ${chalk.bold('Updated:')} ${new Date(order.updated_at).toLocaleString()}`);
  console.log(`    ${chalk.bold('Received:')} ${new Date(order.fetched_at).toLocaleString()}`);
  
  console.log(chalk.gray('\n  ════════════════════════════════════════════════════════════'));
}

function formatStatus(status: string): string {
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

async function main() {
  console.log(chalk.blue.bold('\n📋 GloriaFood Orders Viewer\n'));

  try {
    // Only support default command: show all orders (limit 50 by default)
    const limit = 50;
    const orders = await handleAsync(database.getAllOrders(limit));
    const totalCount = await handleAsync(database.getOrderCount());
    
    console.log(chalk.green.bold(`📦 All Orders (Showing ${Math.min(limit, orders.length)} of ${totalCount}):\n`));
    
    if (orders.length === 0) {
      console.log(chalk.gray('  No orders found in database.'));
    } else {
      orders.forEach((order, index) => {
        displayOrder(order, index);
      });
      console.log(chalk.green(`\n✅ Displayed ${orders.length} order(s)\n`));
    }

  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  } finally {
    const closeResult = database.close();
    if (closeResult instanceof Promise) {
      await closeResult;
    }
  }
}

main();

