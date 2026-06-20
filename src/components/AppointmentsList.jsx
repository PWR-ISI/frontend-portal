import { useState } from 'react';
import '../styles/components/AppointmentsList.css';

// Map appointment statuses to friendly Polish labels.
const STATUS_LABELS = {
  paid: 'Potwierdzona',
  pending_payment: 'Oczekuje na płatność',
  completed: 'Zakończona',
  cancelled: 'Odwołana',
  expired: 'Wygasła',
  failed: 'Nieudana',
  scheduled: 'Zaplanowana',
};

const apptDate = (a) => a.scheduled_start || a.appointment_date;
const statusLabel = (s) => STATUS_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

function AppointmentDetailModal({ appointment, onClose }) {
  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString('pl-PL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h2>Szczegóły wizyty</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div><strong>Termin:</strong> {formatDate(apptDate(appointment))}</div>
          <div><strong>Lekarz:</strong> {appointment.doctor_name || 'Dr Anna Lekarz'}</div>
          <div><strong>Typ:</strong> {appointment.appointment_type || 'Wizyta lekarska'}</div>
          <div>
            <strong>Status:</strong>{' '}
            <span className={`status ${(appointment.status || '').toLowerCase()}`}>
              {statusLabel(appointment.status)}
            </span>
          </div>
          {appointment.notes && (
            <div><strong>Notatki:</strong> {appointment.notes}</div>
          )}
          {appointment.visit_summary && (
            <div><strong>Podsumowanie wizyty:</strong> {appointment.visit_summary}</div>
          )}
          {appointment.cancellation_reason && (
            <div><strong>Powód odwołania:</strong> {appointment.cancellation_reason}</div>
          )}

          <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>
            ID: {appointment.id}
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '1rem', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>Zamknij</button>
        </div>
      </div>
    </div>
  );
}

// Prompt for a cancel reason or a post-visit summary before running the action.
function ActionModal({ action, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const isCancel = action.type === 'cancel';

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(action.appointment.id, text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2>{isCancel ? 'Odwołaj wizytę' : 'Zakończ wizytę'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="action-text">
              {isCancel ? 'Powód odwołania (opcjonalnie)' : 'Podsumowanie wizyty (opcjonalnie)'}
            </label>
            <textarea
              id="action-text"
              rows="4"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isCancel ? 'np. Pacjent poprosił o zmianę terminu' : 'np. Zalecenia, rozpoznanie, dalsze kroki'}
            />
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Anuluj</button>
          <button className={`btn ${isCancel ? 'btn-cancel' : 'btn-primary'}`} onClick={submit} disabled={busy}>
            {busy ? 'Przetwarzanie...' : (isCancel ? 'Odwołaj wizytę' : 'Zakończ wizytę')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsList({ appointments, onCancel, onComplete, onPay, onAddRecord }) {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [action, setAction] = useState(null); // { type: 'cancel'|'complete', appointment }

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString('pl-PL', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  const getStatusClass = (status) => `status ${(status || '').toLowerCase()}`;
  const canCancel = (s) => s === 'scheduled' || s === 'paid' || s === 'pending_payment';
  const canComplete = (s) => s === 'scheduled' || s === 'paid';
  const canPay = (s) => s === 'scheduled' || s === 'pending_payment';

  const runAction = async (id, text) => {
    const handler = action.type === 'cancel' ? onCancel : onComplete;
    setAction(null);
    if (handler) await handler(id, text);
  };

  return (
    <>
      <div className="appointments-list">
        {appointments.length === 0 ? (
          <p className="empty-state">Brak wizyt</p>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Termin</th>
                <th>Lekarz</th>
                <th>Typ</th>
                <th>Status</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appointment => (
                <tr key={appointment.id}>
                  <td>{formatDate(apptDate(appointment))}</td>
                  <td>{appointment.doctor_name || 'Dr Anna Lekarz'}</td>
                  <td>{appointment.appointment_type || 'Wizyta lekarska'}</td>
                  <td>
                    <span className={getStatusClass(appointment.status)}>
                      {statusLabel(appointment.status)}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action btn-view" onClick={() => setSelectedAppointment(appointment)}>
                      Szczegóły
                    </button>
                    {onPay && canPay(appointment.status) && (
                      <button className="btn-action btn-pay" onClick={() => onPay(appointment)}>
                        Opłać
                      </button>
                    )}
                    {onAddRecord && (
                      <button className="btn-action btn-doc" onClick={() => onAddRecord(appointment)}>
                        Dokument
                      </button>
                    )}
                    {onComplete && canComplete(appointment.status) && (
                      <button className="btn-action btn-complete" onClick={() => setAction({ type: 'complete', appointment })}>
                        Zakończ
                      </button>
                    )}
                    {onCancel && canCancel(appointment.status) && (
                      <button className="btn-action btn-cancel" onClick={() => setAction({ type: 'cancel', appointment })}>
                        Odwołaj
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
      {action && (
        <ActionModal action={action} onClose={() => setAction(null)} onConfirm={runAction} />
      )}
    </>
  );
}
