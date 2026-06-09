import { useState, useEffect } from 'react';
import { adminAPI, doctorAPI, facilityAPI } from '../api';
import '../styles/components/Modal.css';

export default function AddDoctorModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    specialization: '',
    facility_id: '',
    license_number: '',
  });
  const [photo, setPhoto] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [errors, setErrors] = useState([]); // [{field, message}]
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    facilityAPI.list()
      .then((res) => setFacilities(res.data.results || res.data || []))
      .catch(() => setFacilities([]));
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fieldError = (field) => errors.find((er) => er.field === field)?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors([]);

    if (!form.first_name || !form.last_name || !form.email || !form.password ||
        !form.specialization || !form.facility_id) {
      setError('Wypełnij wszystkie wymagane pola (*).');
      return;
    }

    setLoading(true);
    try {
      // 1) Create the login account (Cognito + DB) in auth-identity.
      const acc = await adminAPI.createStaff({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        role: 'doctor',
      });
      const userId = acc.data.user_id;

      // 2) Create the doctor profile (+ optional photo) in facility-staff.
      const fd = new FormData();
      fd.append('user_id', userId);
      fd.append('email', form.email);
      fd.append('first_name', form.first_name);
      fd.append('last_name', form.last_name);
      fd.append('specialization', form.specialization);
      fd.append('facility_id', form.facility_id);
      if (form.license_number) fd.append('license_number', form.license_number);
      if (photo) fd.append('photo', photo);

      await doctorAPI.createProfile(fd);

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (Array.isArray(data?.errors)) {
        setErrors(data.errors);
        setError('Popraw błędy walidacji.');
      } else {
        setError(data?.error || data?.detail || 'Nie udało się dodać lekarza.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Dodaj lekarza</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="first_name">Imię *</label>
            <input id="first_name" name="first_name" type="text" value={form.first_name} onChange={change} required />
            {fieldError('first_name') && <small className="error-message">{fieldError('first_name')}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Nazwisko *</label>
            <input id="last_name" name="last_name" type="text" value={form.last_name} onChange={change} required />
            {fieldError('last_name') && <small className="error-message">{fieldError('last_name')}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" value={form.email} onChange={change} required />
            {fieldError('email') && <small className="error-message">{fieldError('email')}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło tymczasowe *</label>
            <input id="password" name="password" type="password" value={form.password} onChange={change} required minLength={8} />
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Specjalizacja *</label>
            <input id="specialization" name="specialization" type="text" value={form.specialization} onChange={change} required />
            {fieldError('specialization') && <small className="error-message">{fieldError('specialization')}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="facility_id">Placówka *</label>
            <select id="facility_id" name="facility_id" value={form.facility_id} onChange={change} required>
              <option value="">-- Wybierz placówkę --</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}{f.city ? ` (${f.city})` : ''}</option>
              ))}
            </select>
            {fieldError('facility_id') && <small className="error-message">{fieldError('facility_id')}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="license_number">Nr licencji</label>
            <input id="license_number" name="license_number" type="text" value={form.license_number} onChange={change} />
          </div>

          <div className="form-group">
            <label htmlFor="photo">Zdjęcie profilowe (opcjonalnie)</label>
            <input id="photo" name="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0] || null)} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Anuluj</button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Dodaję...' : 'Dodaj lekarza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
