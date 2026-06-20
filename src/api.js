import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const SCHEDULE_SERVICE_URL = import.meta.env.VITE_SCHEDULE_SERVICE_URL || 'http://localhost:8001';
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001/api/v2';
const FACILITY_SERVICE_URL = import.meta.env.VITE_FACILITY_SERVICE_URL || 'http://localhost:8004';
const MEDICAL_RECORD_SERVICE_URL = import.meta.env.VITE_MEDICAL_RECORD_SERVICE_URL || 'http://localhost:8005';
const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8006';
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:8007';

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
const paymentApi = createServiceApi(PAYMENT_SERVICE_URL);

// DRF list endpoints paginate at PAGE_SIZE=10. To show *all* rows (users, doctors)
// we follow the `next` links and concatenate every page. Returns a plain array.
async function fetchAllPages(apiInstance, path, params = {}) {
  const out = [];
  let res = await apiInstance.get(path, { params: { ...params, page_size: 1000 } });
  // Guard against a misbehaving `next` loop.
  for (let guard = 0; guard < 100; guard += 1) {
    const d = res.data;
    if (Array.isArray(d)) { out.push(...d); break; }
    out.push(...(d.results || []));
    if (!d.next) break;
    res = await apiInstance.get(d.next);
  }
  return out;
}

export const appointmentAPI = {
  // NOTE: schedule-service router uses trailing_slash=False -> no trailing slash here.
  list: () => scheduleApi.get('/api/v1/appointments'),
  get: (id) => scheduleApi.get(`/api/v1/appointments/${id}`),
  create: (data) => {
    const payload = {
      slot_id: data.slot_id,
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
    };
    if (data.facility_id) payload.facility_id = data.facility_id;
    if (data.notes) payload.notes = data.notes;
    return scheduleApi.post('/api/v1/appointments', payload);
  },
  // Cancel (patient/doctor/clerk). Optional reason recorded + sent in the notification.
  cancel: (id, reason = '') => scheduleApi.post(`/api/v1/appointments/${id}/cancel`, { reason }),
  // Finish a visit (doctor/clerk) with an optional post-visit summary.
  complete: (id, visit_summary = '') =>
    scheduleApi.post(`/api/v1/appointments/${id}/complete`, { visit_summary }),
};

export const scheduleAPI = {
  list: () => scheduleApi.get('/api/v1/doctor-schedules/'),
  getAvailableSlots: (doctorId, date) =>
    scheduleApi.get('/api/v1/slots', { params: { doctor_id: doctorId, from: date, to: date } }),
  // All AVAILABLE slots for a doctor (no date filter). The patient view filters by the
  // local calendar day client-side, which avoids UTC-vs-local date-boundary mismatches.
  getAvailableSlotsAll: (doctorId) =>
    scheduleApi.get('/api/v1/slots', { params: { doctor_id: doctorId } }),
  getDoctorSlots: (doctorId) =>
    scheduleApi.get('/api/v1/slots', { params: { doctor_id: doctorId } }),
  // All slots for a doctor on a given day (any status) — to know which hours are taken.
  getSlotsForDay: (doctorId, date) =>
    scheduleApi.get('/api/v1/slots', { params: { doctor_id: doctorId, from: date, to: date, status: 'all' } }),
  // Doctor creates a free slot for themselves (backend forces doctor_id from the token).
  createSlot: ({ doctor_id, facility_id, start_time, end_time }) =>
    scheduleApi.post('/api/v1/slots', { doctor_id, facility_id, start_time, end_time }),
};

// Doctor directory lives in facility-staff-service (paginated DRF responses).
export const doctorAPI = {
  // Patient/admin search by specialization / facility / free-text.
  search: (params) => facilityApi.get('/api/v2/doctors/', { params }),
  adminList: () => facilityApi.get('/api/v2/doctors/'),
  // Same as search/adminList but follows pagination so EVERY doctor is returned
  // (otherwise only the first 10 are found/visible). Returns a plain array.
  searchAll: (params = {}) => fetchAllPages(facilityApi, '/api/v2/doctors/', params),
  adminListAll: () => fetchAllPages(facilityApi, '/api/v2/doctors/'),
  // Create the doctor profile (multipart: text fields + optional photo).
  createProfile: (formData) =>
    facilityApi.post('/api/v2/doctors/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteProfile: (id) => facilityApi.delete(`/api/v2/doctors/${id}/`),
};

export const facilityAPI = {
  list: () => facilityApi.get('/api/v2/facilities/'),
  // Admin registers a new facility (FacilityRegistration).
  create: (data) => facilityApi.post('/api/v2/facilities/', data),
};

// Admin account provisioning lives in auth-identity-service.
export const adminAPI = {
  // Accepts a plain object (JSON) or FormData (when an avatar photo is attached).
  createStaff: (data) =>
    data instanceof FormData
      ? authApi.post('/admin/staff/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : authApi.post('/admin/staff/', data),
};

export const userAPI = {
  list: () => authApi.get('/users/'),
  // Every user across all pages (the admin list must show all 19+, not just 10).
  listAll: () => fetchAllPages(authApi, '/users/'),
  get: (id) => authApi.get(`/users/${id}/`),
  create: (data) => adminAPI.createStaff(data),
  update: (id, data) => authApi.patch(`/users/${id}/`, data),
  delete: (id) => authApi.delete(`/users/${id}/`),
};

export const medicalRecordAPI = {
  list: (params) => medicalRecordApi.get('/api/v2/records/', { params }),
  get: (id) => medicalRecordApi.get(`/api/v2/records/${id}/`),
  // Doctor/clerk adds a document for a patient (multipart: file + patient_id + type + desc).
  // medical-record router uses trailing slashes (APPEND_SLASH) -> keep the slash.
  upload: (formData) =>
    medicalRecordApi.post('/api/v2/records/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const notificationAPI = {
  list: () => notificationApi.get('/api/v2/notifications/'),
  unreadCount: () => notificationApi.get('/api/v2/notifications/unread_count/'),
  markRead: (id) => notificationApi.put(`/api/v2/notifications/${id}/read/`),
  markAllRead: () => notificationApi.put('/api/v2/notifications/mark_all_as_read/'),
};

export const paymentAPI = {
  createOrder: (data) => paymentApi.post('/api/payments/orders/', data),
  getOrder: (id) => paymentApi.get(`/api/payments/orders/${id}/`),
  listOrders: (patientId) => paymentApi.get('/api/payments/orders/', { params: { patient_id: patientId } }),
  getPayment: (id) => paymentApi.get(`/api/payments/payments/${id}/`),
  refund: (paymentId) => paymentApi.post(`/api/payments/payments/${paymentId}/refund/`),
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
