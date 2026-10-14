import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const unavailableMessage = isLocal
      ? 'The local API or database is unavailable. Start the backend and PostgreSQL, then try again.'
      : 'The service is temporarily unavailable. Please try again shortly.';
    const message = (isLocal && status === 502)
      ? unavailableMessage
      : error.response?.data?.error
        || ([502, 503, 504].includes(status) ? unavailableMessage : error.message)
        || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(new Error(message));
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getSearchSuggestions: (q) => api.get('/products/search-suggestions', { params: { q } }),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// Cart
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (itemId, data) => api.put(`/cart/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
};

// Wishlist
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist', { product_id: productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

// Orders
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
};

// Reviews
export const reviewsAPI = {
  getByProduct: (productId, params) => api.get(`/reviews/${productId}`, { params }),
  submit: (productId, data) => api.post(`/reviews/${productId}`, data),
};

// Users
export const usersAPI = {
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
};

// AI
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  getRecommendations: (data) => api.post('/ai/recommendations', data),
  compare: (productIds) => api.post('/ai/compare', { product_ids: productIds }),
  analyzeImage: (formData) => api.post('/ai/analyze-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getReviewSummary: (productId) => api.post(`/ai/review-summary/${productId}`),
  getBudgetSuggestions: (data) => api.post('/ai/budget-suggestions', data),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  bulkImport: (formData) => api.post('/admin/products/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getInventory: () => api.get('/admin/inventory'),
  createCategory: (data) => api.post('/admin/categories', data),
};

export default api;
