import axios from 'axios';
import API_CONFIG from '../config/api.config';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(errorMessage);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addQuantity: (id, data) => api.post(`/products/${id}/add-quantity`, data),
};

// Units API
export const unitsAPI = {
  getAll: () => api.get('/units'),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  delete: (id) => api.delete(`/units/${id}`),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Sales API
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  delete: (id) => api.delete(`/sales/${id}`),
};

// Purchase History API
export const purchaseHistoryAPI = {
  getAll: (params) => api.get('/purchase-history', { params }),
  getByProduct: (productId) => api.get(`/purchase-history/product/${productId}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getTopProducts: (params) => api.get('/dashboard/top-products', { params }),
  getSalesTrend: (params) => api.get('/dashboard/sales-trend', { params }),
  getPurchaseTrend: (params) => api.get('/dashboard/purchase-trend', { params }),
  getLowStock: (params) => api.get('/dashboard/low-stock', { params }),
};

// License API (no auth required)
export const licenseAPI = {
  getDeviceNumber: () => api.get('/license/device-number'),
  validate: (deviceNumber, licenseKey) => api.post('/license/validate', { deviceNumber, licenseKey }),
  check: () => api.get('/license/check'),
};

// Database View API (dev only)
export const databaseViewAPI = {
  getAllTables: () => api.get('/database-view/all'),
  getTables: () => api.get('/database-view/tables'),
  getTable: (tableName, params) => api.get(`/database-view/table/${tableName}`, { params }),
};

export default api;

