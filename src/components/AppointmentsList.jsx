import '../styles/components/AppointmentsList.css';

export default function AppointmentsList({ appointments, detailed = false }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusClass = (status) => {
    return `status ${status.toLowerCase()}`;
  };

  return (
    <div className="appointments-list">
      {appointments.length === 0 ? (
        <p className="empty-state">No appointments</p>
      ) : (
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Doctor</th>
              <th>Patient</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appointment => (
              <tr key={appointment.id}>
                <td>{formatDate(appointment.appointment_date)}</td>
                <td>{appointment.doctor_name || 'N/A'}</td>
                <td>{appointment.patient_name || 'N/A'}</td>
                <td>{appointment.appointment_type || 'Regular'}</td>
                <td>
                  <span className={getStatusClass(appointment.status)}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button className="btn-action btn-view">View</button>
                  {appointment.status === 'scheduled' && (
                    <button className="btn-action btn-cancel">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
