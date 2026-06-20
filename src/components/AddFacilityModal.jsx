import { useState } from 'react';
import { facilityAPI } from '../api';
import '../styles/components/Modal.css';

// Admin registers a new facility (FacilityRegistration / FacilityRegistrationAdmin).
export default function AddFacilityModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.address || !form.city) {
      setError('Wypełnij wymagane pola (*).');
      return;
    }
    setLoading(true);
    try {
      await facilityAPI.create(form);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || (typeof data === 'object' ? JSON.stringify(data) : data) || 'Nie udało się dodać placówki.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Dodaj placówkę</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Nazwa *</label>
            <input id="name" name="name" type="text" value={form.name} onChange={change} required />
          </div>
          <div className="form-group">
            <label htmlFor="address">Adres *</label>
            <input id="address" name="address" type="text" value={form.address} onChange={change} required />
          </div>
          <div className="form-group">
            <label htmlFor="city">Miasto *</label>
            <input id="city" name="city" type="text" value={form.city} onChange={change} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Telefon</label>
            <input id="phone" name="phone" type="text" value={form.phone} onChange={change} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={change} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Anuluj</button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Dodaję...' : 'Dodaj placówkę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
