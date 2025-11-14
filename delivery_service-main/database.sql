-- GloriaFood Filippino Orders Database
-- For XAMPP MySQL/MariaDB

-- Create database
CREATE DATABASE IF NOT EXISTS gloriafood_orders CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE gloriafood_orders;

-- Create orders table
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

-- Show success message
SELECT 'Database and table created successfully!' AS Status;

