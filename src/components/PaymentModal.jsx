import { useState } from 'react';
import { paymentAPI } from '../api';
import { useCognitoAuth } from '../CognitoAuthContext';
import '../styles/components/PaymentModal.css';

export default function PaymentModal({ appointment, onClose, onSuccess }) {
  const { user } = useCognitoAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await paymentAPI.createOrder({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        amount: appointment.price || '100.00',
        currency: 'PLN',
        description: `Wizyta ${appointment.scheduled_start
          ? new Date(appointment.scheduled_start).toLocaleDateString('pl-PL') : 'lekarska'}`,
        buyer_email: user?.email || '',
        buyer_first_name: user?.first_name || '',
        buyer_last_name: user?.last_name || '',
      });
      const redirect = res?.data?.redirect_url;
      if (redirect) {
        window.location.href = redirect;
      } else {
        setError('Nie otrzymano adresu przekierowania do PayU.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Blad inicjalizacji platnosci.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Platnosc za wizyte</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="payment-modal-body">
          <div className="payment-summary">
            <span>{appointment.doctor_name || 'Wizyta lekarska'}</span>
            <strong>{appointment.price || '100.00'} PLN</strong>
          </div>

          {appointment.scheduled_start && (
            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', margin: '0 0 20px' }}>
              {new Date(appointment.scheduled_start).toLocaleDateString('pl-PL', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}

          {error && <div className="payment-error">{error}</div>}

          <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '20px' }}>
            Zostaniesz przekierowany na strone platnosci PayU.
            Po zakonczeniu wrocisz automatycznie do aplikacji.
          </p>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose} disabled={loading}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handlePay} disabled={loading}>
              {loading ? 'Przekierowywanie...' : `Zaplac ${appointment.price || '100.00'} PLN`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
