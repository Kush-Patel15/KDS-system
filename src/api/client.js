const BASE = import.meta.env.VITE_API_BASE_URL;

async function core(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers||{}) },
    ...opts
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  
  const data = await res.json().catch(() => null);
  return data;
}

// MENU ITEMS - Remove /api prefix since it's in BASE URL
export async function fetchMenuItems() {
  try {
    const data = await core("/menu-items"); // Changed from "/api/menu-items"
    return Array.isArray(data) ? data : (data?.items || data?.menuItems || []);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ORDERS - Remove /api prefix
export async function createOrder({ items, customerName, customerPhone, orderType }) {
  return core("/orders", { // Changed from "/api/orders"
    method: "POST",
    body: JSON.stringify({
      items: items.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity
      })),
      customerName,
      customerPhone,
      orderType
    })
  });
}

export async function fetchOrderById(id) {
  const data = await core(`/orders/${id}`); // Changed from "/api/orders"
  return data.order;
}

export async function fetchOrderByOrderCode(orderCode) {
  const data = await core(`/orders/order-id/${orderCode}`); // Changed from "/api/orders"
  return data.order;
}

export async function fetchActiveOrders() {
  const data = await core("/orders/active"); // Changed from "/api/orders"
  return data.orders || [];
}

export async function updateOrderStatus(id, status) {
  const data = await core(`/orders/${id}/status`, { // Changed from "/api/orders"
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  return data.order;
}

// ANALYTICS
export async function fetchDashboardAnalytics() {
  const data = await core("/api/analytics/dashboard");
  return data.analytics;
}

// USERS (basic)
export async function fetchUsers() {
  const data = await core("/api/users");
  return data.users || [];
}

// AUTH (if you added AuthController)
export async function login(email, password) {
  const data = await core("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  return data.user;
}

export async function signup(payload) {
  const data = await core("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) });
  return data.user;
}