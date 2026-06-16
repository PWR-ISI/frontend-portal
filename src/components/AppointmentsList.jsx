import { useState } from 'react';
import '../styles/components/AppointmentsList.css';

// Map appointment-service statuses to friendly Polish labels.
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
          <h2>Appointment Details</h2>
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
            <div><strong>Notes:</strong> {appointment.notes}</div>
          )}

          <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>
            ID: {appointment.id}
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '1rem', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsList({ appointments, onCancel }) {
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString('pl-PL', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  const getStatusClass = (status) => `status ${(status || '').toLowerCase()}`;
  const canCancel = (s) => s === 'scheduled' || s === 'paid' || s === 'pending_payment';

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
                    {canCancel(appointment.status) && (
                      <button className="btn-action btn-cancel" onClick={() => onCancel && onCancel(appointment.id)}>
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
    </>
  );
}
