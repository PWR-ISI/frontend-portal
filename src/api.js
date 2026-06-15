import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const SCHEDULE_SERVICE_URL = import.meta.env.VITE_SCHEDULE_SERVICE_URL || 'http://localhost:8001';
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001/api/v2';
const FACILITY_SERVICE_URL = import.meta.env.VITE_FACILITY_SERVICE_URL || 'http://localhost:8004';
const MEDICAL_RECORD_SERVICE_URL = import.meta.env.VITE_MEDICAL_RECORD_SERVICE_URL || 'http://localhost:8005';
const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8006';

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
const authApi = createServiceApi(AUTH_SERVICE_URL);
const facilityApi = createServiceApi(FACILITY_SERVICE_URL);
const medicalRecordApi = createServiceApi(MEDICAL_RECORD_SERVICE_URL);
const notificationApi = createServiceApi(NOTIFICATION_SERVICE_URL);

export const appointmentAPI = {
  list: () => scheduleApi.get('/api/v1/appointments/'),
  get: (id) => scheduleApi.get(`/api/v1/appointments/${id}/`),
  create: (data) => {
    const payload = { slot_id: data.slot_id };
    if (data.notes) payload.notes = data.notes;
    return scheduleApi.post('/api/v1/appointments/', payload);
  },
  cancel: (id) => scheduleApi.post(`/api/v1/appointments/${id}/cancel/`),
};

export const scheduleAPI = {
  list: () => scheduleApi.get('/api/v1/doctor-schedules/'),
  getAvailableSlots: (doctorId, date) =>
    scheduleApi.get('/api/v1/slots', { params: { doctor_id: doctorId, from: date, to: date } }),
  getDoctorSlots: (doctorId) =>
    scheduleApi.get('/api/v1/slots', { params: { doctor_id: doctorId } }),
};

// Doctor directory lives in facility-staff-service (paginated DRF responses).
export const doctorAPI = {
  // Patient/admin search by specialization / facility / free-text.
  search: (params) => facilityApi.get('/api/v2/doctors/', { params }),
  adminList: () => facilityApi.get('/api/v2/doctors/'),
  // Create the doctor profile (multipart: text fields + optional photo).
  createProfile: (formData) =>
    facilityApi.post('/api/v2/doctors/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const facilityAPI = {
  list: () => facilityApi.get('/api/v2/facilities/'),
};

// Admin account provisioning lives in auth-identity-service.
export const adminAPI = {
  createStaff: (data) => authApi.post('/admin/staff/', data),
};

export const userAPI = {
  list: () => authApi.get('/users/'),
  get: (id) => authApi.get(`/users/${id}/`),
  create: (data) => adminAPI.createStaff(data),
};

export const medicalRecordAPI = {
  list: (params) => medicalRecordApi.get('/api/v2/records/', { params }),
  get: (id) => medicalRecordApi.get(`/api/v2/records/${id}/`),
};

export const notificationAPI = {
  list: () => notificationApi.get('/api/v2/notifications/'),
  unreadCount: () => notificationApi.get('/api/v2/notifications/unread_count/'),
  markRead: (id) => notificationApi.put(`/api/v2/notifications/${id}/read/`),
  markAllRead: () => notificationApi.put('/api/v2/notifications/mark_all_as_read/'),
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
