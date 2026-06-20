import { useState, useEffect } from 'react';
import { userAPI, adminAPI, doctorAPI, facilityAPI } from '../api';
import '../styles/components/Modal.css';

const ROLE_LABELS = {
  patient: 'Pacjent',
  doctor: 'Lekarz',
  staff: 'Personel',
  admin: 'Administrator',
};

// Keep in sync with AddDoctorModal so the patient-side specialization filter stays consistent.
const SPECIALIZATIONS = [
  'Alergolog', 'Anestezjolog', 'Chirurg', 'Dermatolog', 'Diabetolog', 'Endokrynolog',
  'Gastrolog', 'Ginekolog', 'Internista', 'Kardiolog', 'Laryngolog', 'Neurolog',
  'Okulista', 'Onkolog', 'Ortopeda', 'Pediatra', 'Psychiatra', 'Radiolog',
  'Reumatolog', 'Urolog',
];

export default function CreateUserModal({ onClose, onSuccess, roles = ['patient', 'doctor', 'staff', 'admin'] }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'patient',
    specialization: '',
    facility_id: '',
  });
  const [facilities, setFacilities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDoctor = formData.role === 'doctor';

  // Facilities are needed when provisioning a doctor (the doctor profile must reference one).
  useEffect(() => {
    facilityAPI.list()
      .then((res) => setFacilities(res.data.results || res.data || []))
      .catch(() => setFacilities([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError('Wszystkie pola są wymagane');
      return;
    }
    if (isDoctor && (!formData.specialization || !formData.facility_id)) {
      setError('Dla lekarza wybierz specjalizację i placówkę.');
      return;
    }

    setLoading(true);
    try {
      // 1) Create the login account (Cognito + DB) in auth-identity.
      const acc = await adminAPI.createStaff({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // 2) For a doctor, also create the facility profile so the catalog recognises them.
      //    The profile's user_id MUST equal the account's id (the JWT `sub`), otherwise the
      //    doctor logs in but the system does not link them to a doctor profile.
      if (isDoctor) {
        const userId = acc.data?.user_id;
        const fd = new FormData();
        fd.append('user_id', userId);
        fd.append('email', formData.email);
        fd.append('first_name', formData.first_name);
        fd.append('last_name', formData.last_name);
        fd.append('specialization', formData.specialization);
        fd.append('facility_id', formData.facility_id);
        await doctorAPI.createProfile(fd);
      }

      setFormData({
        first_name: '', last_name: '', email: '', password: '',
        role: 'patient', specialization: '', facility_id: '',
      });
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || data?.error || data?.detail || 'Nie udało się utworzyć użytkownika');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Utwórz nowego użytkownika</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="first_name">Imię *</label>
            <input id="first_name" name="first_name" type="text" value={formData.first_name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Nazwisko *</label>
            <input id="last_name" name="last_name" type="text" value={formData.last_name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło *</label>
            <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="role">Rola *</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              {roles.map(role => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </option>
              ))}
            </select>
          </div>

          {isDoctor && (
            <>
              <div className="form-group">
                <label htmlFor="specialization">Specjalizacja *</label>
                <select id="specialization" name="specialization" value={formData.specialization} onChange={handleChange} required>
                  <option value="">-- Wybierz specjalizację --</option>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="facility_id">Placówka *</label>
                <select id="facility_id" name="facility_id" value={formData.facility_id} onChange={handleChange} required>
                  <option value="">-- Wybierz placówkę --</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}{f.city ? ` (${f.city})` : ''}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Tworzę...' : 'Utwórz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
