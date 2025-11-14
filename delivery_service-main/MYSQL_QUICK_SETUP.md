# MySQL/XAMPP Quick Setup Guide

## ✅ Complete Steps to Use XAMPP MySQL Database

### Step 1: Install MySQL Driver
```powershell
cd "C:\Users\Admin\Downloads\delivery_service-main (1)\delivery_service-main"
npm install mysql2
```

### Step 2: Start XAMPP
1. Open **XAMPP Control Panel**
2. Click **Start** for **Apache** and **MySQL**
3. Wait until both show "Running" status

### Step 3: Create Database in phpMyAdmin
1. Open browser: `http://localhost/phpmyadmin`
2. Click **"New"** in left sidebar
3. Database name: `gloriafood_orders`
4. Collation: `utf8mb4_unicode_ci`
5. Click **"Create"**

### Step 4: Import Database Schema
1. In phpMyAdmin, select **`gloriafood_orders`** database
2. Click **"Import"** tab
3. Click **"Choose File"** → Select `database.sql`
4. Click **"Go"** button
5. ✅ You should see "Table 'orders' already exists" or success message

**OR** Manual SQL (in phpMyAdmin SQL tab):
```sql
USE gloriafood_orders;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gloriafood_order_id VARCHAR(255) UNIQUE NOT NULL,
  store_id VARCHAR(255),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(100),
  customer_email VARCHAR(255),
  delivery_address TEXT,
  total_price DECIMAL(10, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50),
  order_type VARCHAR(50),
  items TEXT,
  raw_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gloriafood_order_id (gloriafood_order_id),
  INDEX idx_store_id (store_id),
  INDEX idx_status (status),
  INDEX idx_fetched_at (fetched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 5: Update .env File
Add these lines to your `.env` file:

```env
# Database Type (mysql or sqlite)
DB_TYPE=mysql

# MySQL/XAMPP Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=gloriafood_orders
```

**Note:** 
- XAMPP default password is **empty/blank**
- If you set a MySQL password, put it in `DB_PASSWORD`

### Step 6: Test the Setup
```powershell
npm run webhook
```

Kapag may dumating na order, dapat makita mo:
```
📥 Received webhook for order: [order-id]
✅ New order stored in database: #[order-id]
```

### Step 7: Verify in phpMyAdmin
1. Go to: `http://localhost/phpmyadmin`
2. Select database: **`gloriafood_orders`**
3. Click table: **`orders`**
4. Makikita mo ang lahat ng orders doon!

---

## 🎯 What Happens Now?

✅ **Automatic**: Kapag may order na dumating via webhook:
1. Order ay **auto-save** sa MySQL database
2. Makikita mo sa terminal ang order details
3. Makikita mo rin sa phpMyAdmin (`http://localhost/phpmyadmin`)

✅ **View Orders**: 
- Terminal: `npm run view-orders`
- Browser: `http://localhost:3000/orders`
- phpMyAdmin: `http://localhost/phpmyadmin`

---

## 🔧 Verification

**Check if MySQL is working:**
1. Webhook server: `npm run webhook`
2. Dapat walang error about database connection
3. Place test order → dapat may makita ka sa terminal
4. Check phpMyAdmin → dapat may order na sa `orders` table

**If there are errors:**
- Check XAMPP MySQL is running
- Check database `gloriafood_orders` exists
- Check `.env` file has correct MySQL credentials

---

## 📝 Summary

✅ Code updated - uses MySQL when `DB_TYPE=mysql`
✅ Database factory - auto-selects SQLite or MySQL
✅ All endpoints updated - supports async MySQL
✅ View orders script - works with MySQL

**Just configure `.env` and start webhook server!**

