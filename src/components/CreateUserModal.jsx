import { useState } from 'react';
import { userAPI } from '../api';
import '../styles/components/Modal.css';

const ROLE_LABELS = {
  patient: 'Pacjent',
  doctor: 'Lekarz',
  staff: 'Personel',
  admin: 'Administrator',
};

export default function CreateUserModal({ onClose, onSuccess, roles = ['patient', 'doctor', 'staff', 'admin'] }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'patient',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      await userAPI.create({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'patient',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się utworzyć użytkownika');
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
            <input
              id="first_name"
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Nazwisko *</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło *</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Rola *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </option>
              ))}
            </select>
          </div>

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
