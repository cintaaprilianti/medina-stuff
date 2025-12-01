import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR → JANGAN SENTUH Content-Type kalau FormData!
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Kalau kirim FormData (upload gambar), HAPUS Content-Type biar axios otomatis set boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// RESPONSE INTERCEPTOR
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

// === CATEGORY API ===
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

// === PRODUCT API ===
export const productAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// === VARIANT API ===
export const variantAPI = {
  getByProductId: (productId, includeInactive = false) =>
    api.get(`/products/${productId}/variants`, { params: { includeInactive } }),
  create: (productId, data) => api.post(`/products/${productId}/variants`, data),
  update: (id, data) => api.put(`/variants/${id}`, data),
  delete: (id) => api.delete(`/variants/${id}`),
};

// === UPLOAD API → INI YANG BIKIN UPLOAD JADI JALAN MULUS
export const uploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    // LANGSUNG POST, JANGAN SET HEADER APAPUN!
    return await api.post('/upload/image', formData);
  },
};

export default api;