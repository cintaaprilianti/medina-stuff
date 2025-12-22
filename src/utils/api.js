import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    const msg = error.response?.data?.message || error.message || 'Terjadi kesalahan server';
    return Promise.reject(new Error(msg));
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const categoryAPI = {
  getAll: (includeInactive = false) =>
    api.get('/categories', { params: { includeInactive } }).then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      return { data };
    }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const productAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const variantAPI = {
  getByProductId: (productId, includeInactive = false) =>
    api.get(`/products/${productId}/variants`, { params: { includeInactive } }),
  create: (productId, data) => api.post(`/products/${productId}/variants`, data),
  update: (id, data) => api.put(`/variants/${id}`, data),
  delete: (id) => api.delete(`/variants/${id}`),
};

export const uploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post('/upload/image', formData);
  },
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),

  getAllOrders: (params = {}) => api.get('/orders/admin/all', { params }),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

export const paymentAPI = {
  create: (data) => api.post('/payments', data),
  getByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
  getById: (id) => api.get(`/payments/${id}`),
  updateStatus: (id, data) => api.put(`/payments/${id}/status`, data),
};

export const shipmentAPI = {
  create: (data) => api.post('/shipments', data),
  trackByOrderId: (orderId) => api.get(`/shipments/order/${orderId}/track`),
  getById: (id) => api.get(`/shipments/${id}`),
  updateStatus: (id, data) => api.put(`/shipments/${id}/status`, data),
};

// ✅ NEW: Dashboard & Reports API
export const dashboardAPI = {
  // Dashboard Summary
  getSummary: (params = {}) => api.get('/admin/dashboard/summary', { params }),
  
  // Order Statistics
  getOrderStatistics: (params = {}) => api.get('/admin/dashboard/orders/statistics', { params }),
  
  // Payment Statistics
  getPaymentStatistics: (params = {}) => api.get('/admin/dashboard/payments/statistics', { params }),
  
  // Revenue Trends
  getRevenueTrends: (params = {}) => api.get('/admin/dashboard/revenue/trends', { params }),
  
  // Top Products
  getTopProducts: (params = {}) => api.get('/admin/dashboard/products/top', { params }),
  
  // Product Performance
  getProductPerformance: (params = {}) => api.get('/admin/dashboard/products/performance', { params }),
  
  // Customer Statistics
  getCustomerStatistics: (params = {}) => api.get('/admin/dashboard/customers/statistics', { params }),
  
  // Recent Activity
  getRecentActivity: (params = {}) => api.get('/admin/dashboard/activity/recent', { params }),
};

export const reportsAPI = {
  // Sales Report
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  exportSalesReport: (params) => 
    api.get('/admin/reports/sales/export', { params, responseType: 'blob' }),
  
  // Customer Report
  getCustomerReport: (params) => api.get('/admin/reports/customers', { params }),
  exportCustomerReport: (params) => 
    api.get('/admin/reports/customers/export', { params, responseType: 'blob' }),
  
  // Order Report
  getOrderReport: (params) => api.get('/admin/reports/orders', { params }),
  exportOrderReport: (params) => 
    api.get('/admin/reports/orders/export', { params, responseType: 'blob' }),
  
  // Inventory Report
  getInventoryReport: () => api.get('/admin/reports/inventory'),
  exportInventoryReport: () => 
    api.get('/admin/reports/inventory/export', { responseType: 'blob' }),
  
  // Category Report
  getCategoryReport: (params) => api.get('/admin/reports/category', { params }),
  exportCategoryReport: (params) => 
    api.get('/admin/reports/category/export', { params, responseType: 'blob' }),
};

export default api;