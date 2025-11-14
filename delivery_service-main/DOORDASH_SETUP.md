# DoorDash API Integration Setup Guide

This guide explains how to set up DoorDash API integration for automatic order forwarding.

## Overview

When enabled, the system will automatically forward delivery orders from GloriaFood to DoorDash for fulfillment.

## Features

- ✅ Automatic order forwarding to DoorDash
- ✅ Order format conversion (GloriaFood → DoorDash)
- ✅ Only processes delivery orders
- ✅ Optional - doesn't affect existing functionality
- ✅ Error handling - webhook won't fail if DoorDash call fails

## Prerequisites

1. DoorDash Developer Account
   - Sign up at: https://developer.doordash.com/
   - Complete the application process

2. DoorDash API Credentials
   - Developer ID
   - Key ID
   - Signing Secret
   - Merchant ID (optional)

## Setup Instructions

### Step 1: Get DoorDash API Credentials

1. Log into DoorDash Developer Portal: https://developer.doordash.com/
2. Navigate to your app/credentials section
3. Note down:
   - Developer ID
   - Key ID
   - Signing Secret

### Step 2: Update .env File

Add the following variables to your `.env` file:

```env
# DoorDash API Configuration (Optional)
DOORDASH_DEVELOPER_ID=your_developer_id
DOORDASH_KEY_ID=your_key_id
DOORDASH_SIGNING_SECRET=your_signing_secret
DOORDASH_MERCHANT_ID=your_merchant_id  # Optional
DOORDASH_SANDBOX=true  # Set to false for production
DOORDASH_API_URL=  # Leave empty to use default (sandbox or production)
```

### Step 3: Restart Webhook Server

```powershell
npm run webhook
```

You should see:
- `✅ DoorDash API client initialized` - if credentials are valid
- `ℹ️  DoorDash integration disabled` - if credentials are missing

## How It Works

1. **Order Receives from GloriaFood**
   - Webhook receives order data

2. **Order Saved to Database**
   - Order is saved as normal

3. **DoorDash Forwarding (if enabled)**
   - Checks if order type is "delivery"
   - Converts order format from GloriaFood to DoorDash
   - Sends order to DoorDash API
   - Logs success/failure

## Order Conversion

The system automatically converts:
- Customer information (name, phone, email)
- Delivery address
- Order items
- Totals (subtotal, tax, total)
- Special instructions

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DOORDASH_DEVELOPER_ID` | Yes | Your DoorDash Developer ID |
| `DOORDASH_KEY_ID` | Yes | Your DoorDash Key ID |
| `DOORDASH_SIGNING_SECRET` | Yes | Your DoorDash Signing Secret |
| `DOORDASH_MERCHANT_ID` | No | Your DoorDash Merchant ID |
| `DOORDASH_SANDBOX` | No | Set to `true` for testing (default: false) |
| `DOORDASH_API_URL` | No | Custom API URL (leave empty for default) |

## Testing

### Test with Sandbox

1. Set `DOORDASH_SANDBOX=true` in `.env`
2. Use sandbox credentials
3. Place a test delivery order
4. Check console for DoorDash response

### Production Setup

1. Set `DOORDASH_SANDBOX=false` or remove the variable
2. Use production credentials
3. Ensure all credentials are correct
4. Test with a real order

## Troubleshooting

### DoorDash client not initializing

**Problem:** `⚠️  Failed to initialize DoorDash client`

**Solutions:**
- Check credentials in `.env` file
- Verify credentials are correct in DoorDash Developer Portal
- Check network connectivity

### Orders not sending to DoorDash

**Check:**
1. ✅ DoorDash client initialized? (check console on startup)
2. ✅ Order type is "delivery"? (DoorDash only handles delivery orders)
3. ✅ Valid customer and delivery address?
4. ✅ Check console logs for error messages

### Error: "DoorDash API Error: 401"

**Solution:**
- Verify credentials are correct
- Check if credentials have expired
- Ensure you're using correct environment (sandbox vs production)

### Error: "DoorDash API Error: 400"

**Solution:**
- Check order data format
- Verify required fields are present:
  - Customer name
  - Phone number
  - Delivery address (street, city, state, zip)
  - At least one item

## API Methods Available

The DoorDash client provides these methods:

- `createDeliveryOrder()` - Create a new delivery order
- `getOrderStatus()` - Get order status
- `cancelOrder()` - Cancel an order
- `convertGloriaFoodOrderToDoorDash()` - Convert order format
- `testConnection()` - Test API connection

## Console Logs

When an order is sent to DoorDash, you'll see:

```
🚚 Sending order to DoorDash...
✅ Order sent to DoorDash successfully
   DoorDash Order ID: xxx
   Status: created
```

If there's an error:

```
❌ Failed to send order to DoorDash: [error message]
```

## Notes

- DoorDash integration is **completely optional**
- If credentials are not provided, the system works normally (no DoorDash calls)
- Errors in DoorDash calls don't affect webhook processing
- Only "delivery" type orders are sent to DoorDash
- Order updates are not sent (only new orders)

## Support

For DoorDash API documentation:
- https://developer.doordash.com/
- https://developer.doordash.com/guides/api-documentation

For issues with this integration:
- Check console logs for detailed error messages
- Verify credentials and order data format

