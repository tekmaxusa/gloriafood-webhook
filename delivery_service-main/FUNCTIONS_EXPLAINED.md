# 📚 Pal explaining ng Lahat ng Functions

## 🗂️ Overview

Ito ay complete explanation ng lahat ng functions sa project, organized by file.

---

## 1. 🚚 DoorDash Client (`src/doordash-client.ts`)

### **Class: `DoorDashClient`**

#### **Constructor(config: DoorDashConfig)**
**Ano ang ginagawa:**
- Ini-initialize ang DoorDash API client
- Gumagawa ng axios instance para sa API calls
- Setup JWT authentication (automatic sa bawat request)
- Setup base URL (`https://openapi.doordash.com/drive/v2`)

**Parameters:**
- `developerId` - DoorDash Developer ID
- `keyId` - DoorDash Key ID
- `signingSecret` - DoorDash Signing Secret (for JWT)
- `merchantId` - Optional merchant ID
- `apiUrl` - Optional custom API URL
- `isSandbox` - Optional sandbox mode flag

---

#### **`getJwt(): string`** (Private)
**Ano ang ginagawa:**
- Gumagawa ng JWT (JSON Web Token) para sa DoorDash API authentication
- Short-lived token (5 minutes expiration)
- May caching para hindi mag-generate ng paulit-ulit
- Uses HMAC-SHA256 signature

**Process:**
1. Creates JWT header (alg: HS256, typ: JWT)
2. Creates JWT payload (iss, kid, aud, iat, exp, jti)
3. Signs with signing secret
4. Returns base64url-encoded JWT

**Returns:** JWT token string (e.g., `eyJhbGc...`)

---

#### **`convertGloriaFoodOrderToDoorDash(orderData, storeId?): DoorDashOrder`**
**Ano ang ginagawa:**
- Nagco-convert ng GloriaFood order format to DoorDash format
- Extract customer info (name, phone, email)
- Extract delivery address (street, city, state, zip)
- Extract order items at prices
- Calculate totals (subtotal, tax, total)

**Parameters:**
- `orderData` - Raw GloriaFood order data
- `storeId` - Optional store ID

**Returns:** DoorDash order format object

**Example:**
```typescript
{
  external_store_id: "191847",
  merchant_order_id: "1108600163",
  consumer: { first_name: "Jeremiah", last_name: "Yu", ... },
  delivery_address: { street_address: "...", city: "...", ... },
  items: [...],
  total: 21.42
}
```

---

#### **`convertGloriaFoodToDrive(orderData): DoorDashDriveDelivery`**
**Ano ang ginagawa:**
- Nagco-convert ng GloriaFood order to DoorDash Drive delivery format
- Drive format = Para sa actual delivery (driver dispatch)
- Extract pickup address (restaurant location)
- Extract dropoff address (customer location)
- Normalize phone numbers to E.164 format
- Convert prices to cents (DoorDash requirement)

**Parameters:**
- `orderData` - Raw GloriaFood order data

**Returns:** DoorDash Drive delivery payload

**Example:**
```typescript
{
  external_delivery_id: "1108600163",
  pickup_address: "Restaurant address...",
  dropoff_address: "Customer address...",
  order_value: 2142,  // in cents
  ...
}
```

---

#### **`createDriveDelivery(payload): Promise<DoorDashResponse>`**
**Ano ang ginagawa:**
- **MAIN FUNCTION** - Creates DoorDash delivery order
- **Tumatawag ng driver** via DoorDash API
- POST request to `/drive/v2/deliveries`
- Returns delivery ID, status, tracking URL

**Parameters:**
- `payload` - DoorDash Drive delivery payload

**Returns:**
```typescript
{
  id: "2657907564",           // DoorDash delivery ID
  external_delivery_id: "...",
  status: "created",          // created = driver notified
  tracking_url: "https://...",
  raw: {...}                   // Full API response
}
```

**Process:**
1. POST `/deliveries` with payload
2. DoorDash creates delivery
3. DoorDash assigns driver (if available)
4. Returns delivery details

---

#### **`getOrderStatus(idOrExternalId): Promise<DoorDashResponse>`**
**Ano ang ginagawa:**
- Kumukuha ng current status ng DoorDash delivery
- Try multiple endpoints:
  - `/deliveries/{delivery_id}`
  - `/deliveries/external_delivery_id/{external_id}`
  - `/deliveries/by_external_id/{external_id}`

**Parameters:**
- `idOrExternalId` - DoorDash delivery ID o external ID

**Returns:**
```typescript
{
  id: "2657907564",
  status: "delivered",  // created, claimed, picked_up, delivered
  tracking_url: "...",
  raw: {...}
}
```

**Status values:**
- `created` - Delivery created, waiting for driver
- `claimed` - Driver assigned, heading to pickup
- `picked_up` - Driver has order, heading to customer
- `delivered` - Order delivered successfully
- `cancelled` - Delivery cancelled

---

#### **`cancelOrder(merchantOrderId, reason?): Promise<DoorDashResponse>`**
**Ano ang ginagawa:**
- Cancels a DoorDash delivery
- POST to `/deliveries/{id}/cancel`
- Can only cancel before driver is assigned

**Parameters:**
- `merchantOrderId` - DoorDash delivery ID
- `reason` - Optional cancellation reason

**Returns:** Cancelled delivery response

---

#### **`testConnection(): Promise<boolean>`**
**Ano ang ginagawa:**
- Tests DoorDash API connection
- Validates JWT can be created
- Checks if credentials are valid

**Returns:** `true` if connection OK

---

## 2. 📦 Database MySQL (`src/database-mysql.ts`)

### **Class: `OrderDatabaseMySQL`**

#### **Constructor(config?: Partial<MySQLConfig>)**
**Ano ang ginagawa:**
- Ini-initialize ang MySQL database connection
- Creates connection pool (10 connections max)
- Auto-setup database tables
- Gets config from .env file

**Database fields:**
- `id` - Auto-increment primary key
- `gloriafood_order_id` - Unique order ID
- `customer_name`, `customer_phone`, `customer_email`
- `delivery_address`
- `total_price`, `currency`
- `status`, `order_type`
- `items` - JSON string ng order items
- `raw_data` - Full JSON ng order data
- `sent_to_doordash` - Flag kung nasend na sa DoorDash
- `doordash_order_id` - DoorDash delivery ID
- `doordash_sent_at` - Timestamp kung kailan nasend

---

#### **`initializeTables(): Promise<void>`** (Private)
**Ano ang ginagawa:**
- Gumagawa ng `orders` table kung wala pa
- Creates indexes for fast queries
- Handles connection errors gracefully

**Table structure:**
- All order fields
- Indexes on: `gloriafood_order_id`, `store_id`, `status`, `fetched_at`

---

#### **`insertOrUpdateOrder(orderData): Promise<Order | null>`**
**Ano ang ginagawa:**
- **MAIN FUNCTION** - Saves order to database
- Extract customer data from order
- Insert new order o update existing order
- Uses `ON DUPLICATE KEY UPDATE` (MySQL feature)
- Returns saved order

**Parameters:**
- `orderData` - Raw order data from GloriaFood

**Process:**
1. Extract customer name (try multiple locations)
2. Extract phone, email, address
3. Convert items to JSON string
4. Save to database
5. Return saved order

**Returns:** Saved order object o `null` if failed

---

#### **`extractCustomerName(orderData): string`** (Private)
**Ano ang ginagawa:**
- Extract customer name from order data
- Try multiple locations:
  - `client_first_name` + `client_last_name`
  - `client.name`
  - `client.first_name` + `client.last_name`
  - `customer.name`
  - `customer_name`
  - And more...

**Returns:** Customer name o `"Unknown"` if not found

---

#### **`extractCustomerPhone(orderData): string`** (Private)
**Ano ang ginagawa:**
- Extract customer phone from order data
- Try multiple field names:
  - `client_phone`, `client_phone_number`
  - `client.phone`, `client.mobile`, `client.tel`
  - `customer.phone`
  - `phone`, `phone_number`, `mobile`

**Returns:** Phone number o empty string

---

#### **`extractCustomerEmail(orderData): string`** (Private)
**Ano ang ginagawa:**
- Extract customer email from order data
- Try multiple field names

**Returns:** Email o empty string

---

#### **`extractDeliveryAddress(orderData): string`** (Private)
**Ano ang ginagawa:**
- Extract delivery address from order data
- Try multiple formats:
  - Simple string: `client_address`
  - Structured: `client_address_parts` (street, city, state, zip)
  - Nested: `delivery.address` object
  - Multiple field names

**Returns:** Formatted address string o empty string

---

#### **`getOrderByGloriaFoodId(orderId): Promise<Order | null>`**
**Ano ang ginagawa:**
- Kumukuha ng order by GloriaFood order ID
- SQL: `SELECT * FROM orders WHERE gloriafood_order_id = ?`

**Parameters:**
- `orderId` - GloriaFood order ID

**Returns:** Order object o `null` if not found

---

#### **`getAllOrders(limit): Promise<Order[]>`**
**Ano ang ginagawa:**
- Kumukuha ng lahat ng orders
- Sorted by `fetched_at DESC` (newest first)
- Limited by `limit` parameter

**Parameters:**
- `limit` - Maximum number of orders (default: 50)

**Returns:** Array of orders

---

#### **`getRecentOrders(minutes): Promise<Order[]>`**
**Ano ang ginagawa:**
- Kumukuha ng orders from last N minutes
- SQL: `WHERE fetched_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`

**Parameters:**
- `minutes` - Number of minutes (default: 60)

**Returns:** Array of recent orders

---

#### **`getOrdersByStatus(status): Promise<Order[]>`**
**Ano ang ginagawa:**
- Kumukuha ng orders by status
- SQL: `WHERE status = ?`

**Parameters:**
- `status` - Order status (e.g., "accepted", "pending")

**Returns:** Array of orders with that status

---

#### **`getOrderCount(): Promise<number>`**
**Ano ang ginagawa:**
- Count total orders sa database
- SQL: `SELECT COUNT(*) FROM orders`

**Returns:** Total number of orders

---

#### **`markOrderSentToDoorDash(gloriafoodOrderId, doordashOrderId?): Promise<void>`**
**Ano ang ginagawa:**
- Marks order as sent to DoorDash
- Updates:
  - `sent_to_doordash = 1`
  - `doordash_order_id = ?`
  - `doordash_sent_at = NOW()`

**Parameters:**
- `gloriafoodOrderId` - GloriaFood order ID
- `doordashOrderId` - Optional DoorDash delivery ID

---

#### **`close(): Promise<void>`**
**Ano ang ginagawa:**
- Closes database connection pool
- Cleanup connections
- Should be called before exit

---

## 3. 🌐 GloriaFood Client (`src/gloriafood-client.ts`)

### **Class: `GloriaFoodClient`**

#### **Constructor(config: GloriaFoodConfig)**
**Ano ang ginagawa:**
- Ini-initialize ang GloriaFood API client
- Setup axios instance
- Setup authentication headers (API Key, Master Key)
- Default URL: `https://api.gloriafood.com`

---

#### **`fetchOrders(limit, status?): Promise<GloriaFoodOrder[]>`**
**Ano ang ginagawa:**
- **MAIN FUNCTION** - Fetches orders from GloriaFood API
- Try multiple API endpoints (different versions)
- Handles different response formats

**Parameters:**
- `limit` - Maximum orders to fetch (default: 50)
- `status` - Optional status filter

**Endpoints tried:**
- `/api/v2/restaurants/{storeId}/orders`
- `/api/v1/orders`
- `/api/orders`
- And more...

**Returns:** Array of GloriaFood orders

---

#### **`fetchOrderById(orderId): Promise<GloriaFoodOrder | null>`**
**Ano ang ginagawa:**
- Fetches specific order by ID
- Try multiple endpoints

**Parameters:**
- `orderId` - Order ID

**Returns:** Order object o `null`

---

#### **`fetchOrdersSince(timestamp, limit): Promise<GloriaFoodOrder[]>`**
**Ano ang ginagawa:**
- Fetches orders since a specific timestamp
- For incremental updates

**Parameters:**
- `timestamp` - ISO timestamp
- `limit` - Maximum orders

**Returns:** Array of orders

---

#### **`handleNetworkError(error, operation): never`** (Private)
**Ano ang ginagawa:**
- Handles network errors gracefully
- Provides helpful error messages
- Checks for DNS errors, connection refused, timeouts

---

## 4. 🔗 Webhook Mode (`src/webhook-mode.ts`)

### **Class: `GloriaFoodWebhookServer`**

#### **Constructor(config: WebhookConfig)**
**Ano ang ginagawa:**
- Ini-initialize ang Express webhook server
- Setup database connection
- Initialize DoorDash client (if credentials provided)
- Setup routes at middleware

---

#### **`initializeDoorDash(): void`** (Private)
**Ano ang ginagawa:**
- Ini-initialize ang DoorDash client
- Checks if credentials are in .env
- Creates DoorDashClient instance
- Logs success o warning

**Requirements:**
- `DOORDASH_DEVELOPER_ID`
- `DOORDASH_KEY_ID`
- `DOORDASH_SIGNING_SECRET`

---

#### **`sendOrderToDoorDash(orderData): Promise<{id?, status?} | null>`** (Private)
**Ano ang ginagawa:**
- **MAIN FUNCTION** - Sends order to DoorDash automatically
- Checks if order type is "delivery"
- Converts to DoorDash format
- Creates delivery via API
- Logs success/failure
- **Doesn't fail webhook if DoorDash call fails**

**Parameters:**
- `orderData` - Raw order data from webhook

**Returns:**
- `{id, status}` if successful
- `null` if skipped o failed

**Process:**
1. Check if DoorDash client initialized
2. Check if order type = "delivery"
3. Convert to Drive format
4. POST to DoorDash API
5. Return response

---

#### **`setupMiddleware(): void`** (Private)
**Ano ang ginagawa:**
- Setup Express middleware
- JSON body parser
- Request logging (shows all incoming requests)
- Webhook detection logging

---

#### **`setupRoutes(): void`** (Private)
**Ano ang ginagawa:**
- Setup all HTTP routes

**Routes:**
- `GET /health` - Health check
- `GET /webhook` - Webhook info
- `POST /webhook` - Receive orders (MAIN)
- `GET /orders` - Get all orders
- `GET /orders/:orderId` - Get specific order
- `GET /orders/recent/:minutes` - Get recent orders
- `GET /orders/status/:status` - Get orders by status
- `GET /stats` - Statistics
- `GET /summary` - Summary with revenue

---

#### **`extractOrderData(body): GloriaFoodOrder | null`** (Private)
**Ano ang ginagawa:**
- Extract order data from webhook request body
- Handles different payload structures:
  - `body.order`
  - `body.data.order`
  - `body` directly
  - Array of orders

**Parameters:**
- `body` - Request body

**Returns:** Order data o `null`

---

#### **`displayOrder(order, isNew): Promise<void>`** (Private)
**Ano ang ginagawa:**
- Displays order details sa console
- Shows customer info, delivery address, items
- Color-coded output
- Parses raw_data for additional info

**Parameters:**
- `order` - Order object
- `isNew` - If true, shows "🆕 NEW ORDER"

---

#### **`formatStatus(status): string`** (Private)
**Ano ang ginagawa:**
- Formats order status with colors
- Color mapping:
  - `accepted`, `completed` → Green
  - `pending` → Yellow
  - `preparing` → Cyan
  - `cancelled`, `rejected` → Red

---

#### **`start(): void`**
**Ano ang ginagawa:**
- Starts the webhook server
- Listens on configured port
- Shows all available endpoints
- Shows webhook URL for GloriaFood

**Default port:** 3000
**Default path:** `/webhook`

---

#### **`stop(): Promise<void>`**
**Ano ang ginagawa:**
- Stops the webhook server
- Closes database connection
- Cleanup

---

## 5. 🔄 Polling Mode (`src/index.ts`)

### **Class: `GloriaFoodOrderFetcher`**

#### **Constructor(config: AppConfig)**
**Ano ang ginagawa:**
- Ini-initialize ang polling fetcher
- Setup GloriaFood client
- Setup database connection

---

#### **`start(): Promise<void>`**
**Ano ang ginagawa:**
- **MAIN FUNCTION** - Starts polling
- Initial fetch (fetch orders immediately)
- Start interval polling (every 30 seconds by default)
- Continue until stopped

**Process:**
1. Fetch orders from GloriaFood
2. Save to database
3. Display new orders
4. Wait for interval
5. Repeat

---

#### **`stop(): Promise<void>`**
**Ano ang ginagawa:**
- Stops polling
- Clears interval
- Closes database
- Graceful shutdown

---

#### **`fetchAndStoreOrders(): Promise<void>`**
**Ano ang ginagawa:**
- Fetches orders from GloriaFood API
- Saves to database
- Counts new vs updated orders
- Displays stats
- Handles errors gracefully

**Process:**
1. Call `client.fetchOrders(50)`
2. Loop through orders
3. Check if existing
4. Save to database
5. Display new orders
6. Show stats

---

#### **`displayOrder(order, isNew): void`**
**Ano ang ginagawa:**
- Displays order details sa console
- Shows customer, address, items, totals

---

#### **`formatStatus(status): string`**
**Ano ang ginagawa:**
- Formats status with colors (same as webhook-mode)

---

#### **`displayStats(): void`**
**Ano ang ginagawa:**
- Shows statistics:
  - Total orders
  - Recent orders (last 1 hour)

---

#### **`displayAllOrders(): void`**
**Ano ang ginagawa:**
- Shows all orders sa database
- Limited to 20 most recent

---

## 6. 📊 View Orders (`view-orders.ts`)

### **Functions:**

#### **`displayOrder(order, index?): void`**
**Ano ang ginagawa:**
- Displays complete order details
- Shows all sections:
  - Order Information
  - Customer Information
  - Delivery Information
  - Order Items
  - Timestamps

**Sections:**
- **Order Info:** ID, status, type, total
- **Customer:** Name, phone, email
- **Delivery:** Address, zone, coordinates
- **Items:** List with quantities, prices
- **Timestamps:** Created, updated, received

---

#### **`formatStatus(status): string`**
**Ano ang ginagawa:**
- Formats status with colors
- Same as other files

---

#### **`main(): Promise<void>`**
**Ano ang ginagawa:**
- Main function ng view-orders script
- Gets orders from database
- Displays all orders
- Shows total count

**Default:** Shows 50 most recent orders

---

## 7. 🗃️ Database Factory (`src/database-factory.ts`)

### **Class: `DatabaseFactory`**

#### **`createDatabase(): IDatabase`** (Static)
**Ano ang ginagawa:**
- **MAIN FUNCTION** - Creates database instance
- Auto-selects SQLite o MySQL based on .env
- Checks `DB_TYPE` environment variable
- Checks for MySQL config (DB_HOST, DB_USER, DB_NAME)

**Logic:**
- If `DB_TYPE=mysql` o may MySQL config → Use MySQL
- Otherwise → Use SQLite (default)

**Returns:** Database instance (MySQL o SQLite)

---

## 8. 🚚 Create DoorDash Order (`create-dd-order.ts`)

### **Function: `createDoorDashOrder()`**

**Ano ang ginagawa:**
- **Manual command** to create DoorDash order
- Gets order from database
- Converts to DoorDash format
- Creates delivery via API
- Saves DoorDash ID to database

**Process:**
1. Check DoorDash credentials
2. Test connection
3. Get order from database
4. Parse raw_data
5. Convert to DoorDash format
6. Add unique timestamp to avoid duplicates
7. Create delivery
8. Mark as sent in database

**Command:**
```bash
npm run create-dd <order-id>
```

---

## 📋 Summary ng Lahat ng Functions

### **DoorDash Functions:**
1. ✅ `createDriveDelivery()` - Create delivery, call driver
2. ✅ `getOrderStatus()` - Get delivery status
3. ✅ `cancelOrder()` - Cancel delivery
4. ✅ `convertGloriaFoodToDrive()` - Convert order format
5. ✅ `convertGloriaFoodOrderToDoorDash()` - Alternative conversion
6. ✅ `testConnection()` - Test API connection
7. ✅ `getJwt()` - Generate authentication token

### **Database Functions:**
1. ✅ `insertOrUpdateOrder()` - Save/update order
2. ✅ `getOrderByGloriaFoodId()` - Get order by ID
3. ✅ `getAllOrders()` - Get all orders
4. ✅ `getRecentOrders()` - Get recent orders
5. ✅ `getOrdersByStatus()` - Get orders by status
6. ✅ `getOrderCount()` - Count total orders
7. ✅ `markOrderSentToDoorDash()` - Mark sent to DoorDash
8. ✅ `extractCustomerName()` - Extract customer name
9. ✅ `extractCustomerPhone()` - Extract phone
10. ✅ `extractCustomerEmail()` - Extract email
11. ✅ `extractDeliveryAddress()` - Extract address

### **GloriaFood Functions:**
1. ✅ `fetchOrders()` - Fetch orders from API
2. ✅ `fetchOrderById()` - Get specific order
3. ✅ `fetchOrdersSince()` - Get orders since timestamp

### **Webhook Functions:**
1. ✅ `sendOrderToDoorDash()` - Auto-send to DoorDash
2. ✅ `extractOrderData()` - Extract from webhook body
3. ✅ `displayOrder()` - Show order details
4. ✅ `setupRoutes()` - Setup HTTP endpoints

### **Polling Functions:**
1. ✅ `fetchAndStoreOrders()` - Fetch at save orders
2. ✅ `displayStats()` - Show statistics
3. ✅ `displayAllOrders()` - Show all orders

### **Factory Functions:**
1. ✅ `createDatabase()` - Auto-create database instance

---

## 🎯 Main Workflows

### **1. Webhook Mode (Automatic):**
```
Webhook received → extractOrderData() → insertOrUpdateOrder() 
→ sendOrderToDoorDash() → createDriveDelivery() → markOrderSentToDoorDash()
```

### **2. Polling Mode:**
```
fetchAndStoreOrders() → fetchOrders() → insertOrUpdateOrder() 
→ displayOrder() → displayStats()
```

### **3. Manual DoorDash Creation:**
```
createDoorDashOrder() → getOrderByGloriaFoodId() → convertGloriaFoodToDrive() 
→ createDriveDelivery() → markOrderSentToDoorDash()
```

---

## ✅ All Functions Explained!

Lahat ng functions ay may specific purpose at working together para sa complete order management system!












