import { Link } from 'react-router-dom';

// Landing page PayU redirects the patient back to (continueUrl) after payment.
// The actual confirmation happens server-side via the PayU webhook, so here we just
// inform the patient and link back to their dashboard.
export default function PaymentReturn() {
  return (
    <div className="login-container">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h1>Dziękujemy</h1>
        <p className="subtitle">Płatność jest przetwarzana</p>
        <p style={{ margin: '1rem 0', color: '#555' }}>
          Status Twojej wizyty zostanie zaktualizowany automatycznie po potwierdzeniu
          płatności przez operatora. Możesz sprawdzić go w swoim panelu.
        </p>
        <Link to="/patient/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
          Przejdź do panelu pacjenta
        </Link>
      </div>
    </div>
  );
}
