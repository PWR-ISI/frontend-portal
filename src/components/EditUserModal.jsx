import { useState } from 'react';
import { userAPI } from '../api';
import '../styles/components/Modal.css';

const ROLES = [
  { value: 'patient', label: 'Pacjent' },
  { value: 'doctor', label: 'Lekarz' },
  { value: 'staff', label: 'Personel' },
  { value: 'admin', label: 'Administrator' },
];

// Admin edits an existing user's basic profile + role.
export default function EditUserModal({ user, onClose, onSuccess }) {
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [role, setRole] = useState(user.role || 'patient');
  const [phone, setPhone] = useState(user.phone || user.phone_number || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await userAPI.update(user.id, {
        first_name: firstName,
        last_name: lastName,
        role,
        phone_number: phone,
      });
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Nie udało się zapisać zmian.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edytuj użytkownika</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>E-mail</label>
            <input type="text" value={user.email || ''} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="first_name">Imię</label>
            <input id="first_name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Nazwisko</label>
            <input id="last_name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="role">Rola</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="phone">Telefon</label>
            <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Anuluj</button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
