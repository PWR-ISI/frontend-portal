import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../../api';

// PayU redirects here after payment with ?orderId=... in the URL.
// Webhook handles the actual status update server-side — we poll for confirmation.
export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');

  const [status, setStatus] = useState('pending'); // pending | completed | failed
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!orderId || error) {
      setStatus(error ? 'failed' : 'pending');
      return;
    }

    // Poll payment-service for order status — webhook may arrive a few seconds after redirect
    const MAX_ATTEMPTS = 8;
    const INTERVAL_MS = 3000;

    const poll = async () => {
      try {
        const res = await paymentAPI.getOrder(orderId);
        const orderStatus = res?.data?.status;

        if (orderStatus === 'COMPLETED') {
          setStatus('completed');
          return;
        }
        if (orderStatus === 'EXPIRED' || orderStatus === 'CANCELED') {
          setStatus('failed');
          return;
        }

        setAttempts((prev) => {
          if (prev + 1 >= MAX_ATTEMPTS) {
            // Webhook hasn't arrived yet — show neutral "processing" state
            setStatus('pending');
            return prev;
          }
          return prev + 1;
        });
      } catch {
        // payment-service unreachable — show processing state
        setStatus('pending');
      }
    };

    const interval = setInterval(poll, INTERVAL_MS);
    poll();
    return () => clearInterval(interval);
  }, [orderId, error]);

  const isPolling = status === 'pending' && orderId && !error && attempts < 8;

  return (
    <div className="login-container">
      <div className="login-card" style={{ textAlign: 'center' }}>
        {status === 'completed' && (
          <>
            <h1 style={{ color: '#10b981' }}>Platnosc potwierdzona</h1>
            <p className="subtitle">Wizyta zostala zarezerwowana</p>
            <p style={{ margin: '1rem 0', color: '#555' }}>
              Potwierdzenie zostalo wyslane na Twoj adres e-mail.
              Mozesz sprawdzic szczegoly wizyty w swoim panelu.
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <h1 style={{ color: '#ef4444' }}>Platnosc nieudana</h1>
            <p className="subtitle">Nie udalo sie przetworzyc platnosci</p>
            <p style={{ margin: '1rem 0', color: '#555' }}>
              Srodki nie zostaly pobrane. Sprobuj ponownie lub wybierz inny termin.
            </p>
          </>
        )}

        {status === 'pending' && (
          <>
            <h1>Dziekujemy</h1>
            <p className="subtitle">
              {isPolling ? 'Sprawdzamy status platnosci...' : 'Platnosc jest przetwarzana'}
            </p>
            {isPolling && (
              <p style={{ margin: '0.5rem 0', color: '#999', fontSize: '13px' }}>
                Czekamy na potwierdzenie od operatora platnosci...
              </p>
            )}
            <p style={{ margin: '1rem 0', color: '#555' }}>
              Status Twojej wizyty zostanie zaktualizowany automatycznie.
              Mozesz sprawdzic go w swoim panelu.
            </p>
          </>
        )}

        {orderId && (
          <p style={{ fontSize: '12px', color: '#aaa', margin: '0.5rem 0' }}>
            ID zamowienia: {orderId}
          </p>
        )}

        <Link
          to="/patient/dashboard"
          className="btn-primary"
          style={{ display: 'inline-block', marginTop: '1rem' }}
        >
          Przejdz do panelu pacjenta
        </Link>
      </div>
    </div>
  );
}
