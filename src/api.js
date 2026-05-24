import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) =>
    api.post('/api/v2/auth/login/', { email, password }),
  register: (data) =>
    api.post('/api/v2/auth/register/', data),
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
  },
  getCurrentUser: () => api.get('/api/v2/auth/me/'),
};

export const appointmentAPI = {
  list: () => api.get('/api/v2/appointments'),
  get: (id) => api.get(`/api/v2/appointments/${id}`),
  create: (data) => api.post('/api/v2/appointments', data),
  update: (id, data) => api.put(`/api/v2/appointments/${id}`, data),
  cancel: (id) => api.post(`/api/v2/appointments/${id}/cancel`),
};

export const scheduleAPI = {
  list: () => api.get('/api/v2/schedule'),
  getAvailableSlots: (doctorId, date) =>
    api.get(`/api/v2/schedule/slots`, { params: { doctor_id: doctorId, date } }),
};

export const paymentAPI = {
  list: () => api.get('/api/v2/payments/orders'),
  get: (id) => api.get(`/api/v2/payments/orders/${id}`),
  create: (appointmentId) => api.post('/api/v2/payments/orders', { appointment_id: appointmentId }),
  pay: (orderId) => api.post(`/api/v2/payments/orders/${orderId}/pay`),
};

export const medicalRecordAPI = {
  list: () => api.get('/api/v2/medical-records'),
  get: (id) => api.get(`/api/v2/medical-records/${id}`),
  upload: (appointmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/v2/medical-records/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { appointment_id: appointmentId },
    });
  },
};

export const userAPI = {
  list: () => api.get('/api/v2/users'),
  get: (id) => api.get(`/api/v2/users/${id}`),
  create: (data) => api.post('/api/v2/users', data),
  update: (id, data) => api.put(`/api/v2/users/${id}`, data),
};

export const notificationAPI = {
  list: () => api.get('/api/v2/notifications'),
  markAsRead: (id) => api.put(`/api/v2/notifications/${id}/read`),
};

export const getTokenRole = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.role || decoded.user_role;
  } catch {
    return null;
  }
};

export default api;
