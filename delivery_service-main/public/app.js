// Configuration
const API_BASE = window.location.origin;
const REFRESH_INTERVAL = 5000; // 5 seconds
let autoRefreshInterval = null;
let lastOrderCount = 0;
let lastOrderIds = new Set();

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadOrders();
    
    // Setup auto-refresh
    document.getElementById('autoRefresh').addEventListener('change', (e) => {
        if (e.target.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
    
    // Manual refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadStats();
        loadOrders();
    });
    
    // Status filter
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        loadOrders(e.target.value);
    });
    
    // Start auto-refresh if enabled
    if (document.getElementById('autoRefresh').checked) {
        startAutoRefresh();
    }
});

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalOrders').textContent = data.total_orders || 0;
            document.getElementById('recent1h').textContent = data.recent_orders_1h || 0;
            document.getElementById('recent24h').textContent = data.recent_orders_24h || 0;
            document.getElementById('connectionStatus').textContent = '🟢 Connected';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('connectionStatus').textContent = '🔴 Disconnected';
    }
}

// Load orders
async function loadOrders(statusFilter = '') {
    try {
        const url = statusFilter 
            ? `${API_BASE}/orders/status/${statusFilter}`
            : `${API_BASE}/orders?limit=50`;
        
        console.log('Fetching orders from:', url); // Debug log
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response:', data); // Debug log
        
        if (data.success !== false && (data.orders || Array.isArray(data))) {
            const orders = data.orders || data || [];
            console.log('Loaded orders:', orders.length, orders); // Debug log
            
            if (orders.length > 0) {
                displayOrders(orders);
                // Check for new orders
                checkForNewOrders(orders);
                lastOrderCount = orders.length;
            } else {
                displayOrders([]);
            }
        } else {
            console.error('API returned error:', data);
            showError('Failed to load orders: ' + (data.error || 'Unknown error'));
            displayOrders([]);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Error connecting to server: ' + error.message);
        document.getElementById('connectionStatus').textContent = '🔴 Disconnected';
        displayOrders([]);
    }
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    
    if (!container) {
        console.error('Orders container not found!');
        return;
    }
    
    console.log('Displaying orders:', orders.length, orders); // Debug log
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div>No orders found</div>
                <div style="margin-top: 16px; font-size: 14px; opacity: 0.7;">
                    Make sure the webhook server is running and receiving orders from GloriaFood
                </div>
                <div style="margin-top: 8px; font-size: 12px; opacity: 0.5;">
                    Check browser console (F12) for debug information
                </div>
            </div>
        `;
        return;
    }
    
    try {
        const html = orders.map(order => {
            try {
                return createOrderCard(order);
            } catch (e) {
                console.error('Error creating card for order:', order, e);
                return '';
            }
        }).filter(html => html).join('');
        
        container.innerHTML = html;
        console.log('Orders displayed successfully');
    } catch (error) {
        console.error('Error displaying orders:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div>Error displaying orders</div>
                <div style="margin-top: 16px; font-size: 14px; opacity: 0.7;">
                    ${error.message}
                </div>
            </div>
        `;
    }
}

// Create order card HTML
function createOrderCard(order, isNew = false) {
    if (!order) {
        console.error('Order is null or undefined');
        return '';
    }
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
        if (!text) return 'N/A';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    };
    
    const orderId = order.gloriafood_order_id || order.id || 'N/A';
    const status = (order.status || 'UNKNOWN').toUpperCase();
    const items = parseItems(order.items);
    const orderTime = formatDate(order.fetched_at || order.created_at || order.updated_at);
    
    return `
        <div class="order-card ${isNew ? 'new' : ''}" data-order-id="${escapeHtml(String(orderId))}">
            <div class="order-header">
                <div class="order-id">Order #${escapeHtml(String(orderId))}</div>
                <div class="order-header-right">
                    <div class="order-status status-${status}">${escapeHtml(status)}</div>
                    <button class="btn-delete" onclick="deleteOrder('${escapeHtml(String(orderId))}')" title="Delete order">🗑️</button>
                </div>
            </div>
            <div class="order-info">
                <div class="info-item">
                    <span class="info-label">Customer</span>
                    <span class="info-value">${escapeHtml(order.customer_name || 'N/A')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Phone</span>
                    <span class="info-value">${escapeHtml(order.customer_phone || 'N/A')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${escapeHtml(order.customer_email || 'N/A')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total</span>
                    <span class="info-value">${formatCurrency(order.total_price, order.currency)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Type</span>
                    <span class="info-value">${escapeHtml(order.order_type || 'N/A')}</span>
                </div>
            </div>
            ${order.delivery_address ? `
                <div class="info-item" style="margin-top: 12px;">
                    <span class="info-label">Delivery Address</span>
                    <span class="info-value">${escapeHtml(order.delivery_address)}</span>
                </div>
            ` : ''}
            ${items.length > 0 ? `
                <div class="order-items">
                    <div class="order-items-title">Items:</div>
                    <ul class="item-list">
                        ${items.map(item => `
                            <li>
                                <span>${item.name} x${item.quantity}</span>
                                <span>${formatCurrency(item.price, order.currency)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            <div class="order-time">
                <span>Received: ${orderTime}</span>
            </div>
        </div>
    `;
}

// Check for new orders and show notifications
function checkForNewOrders(orders) {
    const currentOrderIds = new Set(orders.map(o => o.gloriafood_order_id));
    
    // Find new orders
    const newOrders = orders.filter(order => !lastOrderIds.has(order.gloriafood_order_id));
    
    if (newOrders.length > 0) {
        // Show notification for each new order
        newOrders.forEach(order => {
            showNotification(`New Order #${order.gloriafood_order_id}`, 
                `${order.customer_name} - ${formatCurrency(order.total_price, order.currency)}`);
            
            // Show browser notification
            showBrowserNotification(order);
        });
        
        // Update last order IDs
        lastOrderIds = currentOrderIds;
    }
}

// Show notification
function showNotification(title, message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = `${title}: ${message}`;
    notification.className = `notification ${isError ? 'error' : ''}`;
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

// Show browser notification
function showBrowserNotification(order) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New Order #${order.gloriafood_order_id}`, {
            body: `${order.customer_name} - ${formatCurrency(order.total_price, order.currency)}`,
            icon: '🍽️',
            badge: '🍽️',
            tag: `order-${order.gloriafood_order_id}`,
            requireInteraction: false
        });
    }
}

// Show error
function showError(message) {
    showNotification('Error', message, true);
}

// Start auto-refresh
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
        const statusFilter = document.getElementById('statusFilter').value;
        loadStats();
        loadOrders(statusFilter);
    }, REFRESH_INTERVAL);
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Parse items from JSON string
function parseItems(itemsStr) {
    if (!itemsStr) return [];
    
    try {
        const items = typeof itemsStr === 'string' ? JSON.parse(itemsStr) : itemsStr;
        if (Array.isArray(items)) {
            return items;
        }
        return [];
    } catch (e) {
        return [];
    }
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    } catch (e) {
        return dateStr;
    }
}

// Delete order
async function deleteOrder(orderId) {
    if (!confirm(`Are you sure you want to delete Order #${orderId}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Success', `Order #${orderId} deleted successfully`);
            // Reload orders
            const statusFilter = document.getElementById('statusFilter').value;
            loadStats();
            loadOrders(statusFilter);
        } else {
            showError(data.error || 'Failed to delete order');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showError('Error deleting order');
    }
}

// Make deleteOrder available globally
window.deleteOrder = deleteOrder;

