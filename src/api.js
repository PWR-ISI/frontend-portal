import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const SCHEDULE_SERVICE_URL = import.meta.env.VITE_SCHEDULE_SERVICE_URL || 'http://localhost:8001';

const createServiceApi = (baseURL) => {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('id_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
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

  return instance;
};

const scheduleApi = createServiceApi(SCHEDULE_SERVICE_URL);

export const appointmentAPI = {
  list: () => scheduleApi.get('/api/v1/appointments'),
  get: (id) => scheduleApi.get(`/api/v1/appointments/${id}`),
  create: (data) => {
    const formData = new FormData();
    formData.append('slot_id', data.slot_id);
    if (data.notes) formData.append('notes', data.notes);
    if (data.file) formData.append('file', data.file);
    return scheduleApi.post('/api/v1/appointments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  cancel: (id) => scheduleApi.post(`/api/v1/appointments/${id}/cancel`),
};

export const scheduleAPI = {
  list: () => scheduleApi.get('/api/v1/doctor-schedules'),
  getAvailableSlots: (doctorId, date) =>
    scheduleApi.get('/api/v1/slots', { params: { doctor_id: doctorId, from: date, to: date } }),
};

export const userAPI = {
  // Disabled - not used in MVP
  list: () => Promise.reject('disabled'),
  get: (id) => Promise.reject('disabled'),
  create: (data) => Promise.reject('disabled'),
  update: (id, data) => Promise.reject('disabled'),
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
