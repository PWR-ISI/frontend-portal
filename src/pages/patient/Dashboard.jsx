import { useEffect, useState } from 'react';
import { useCognitoAuth } from '../../CognitoAuthContext';
import { appointmentAPI, medicalRecordAPI } from '../../api';
import AppointmentsList from '../../components/AppointmentsList';
import BookAppointmentModal from './BookAppointmentModal';
import '../../styles/patient/Dashboard.css';

export default function PatientDashboard() {
  const { user } = useCognitoAuth();
  const [appointments, setAppointments] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [showRecords, setShowRecords] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await appointmentAPI.list();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentCreated = () => {
    setShowBooking(false);
    loadAppointments();
  };

  const handleViewRecords = async () => {
    if (showRecords) {
      setShowRecords(false);
      return;
    }
    setShowRecords(true);
    setRecordsLoading(true);
    try {
      const res = await medicalRecordAPI.list();
      setRecords(res.data.results || res.data || []);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentAPI.cancel(appointmentId);
        loadAppointments();
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  return (
    <div className="patient-dashboard">
      <header className="dashboard-header">
        <h1>Welcome to Your Patient Portal</h1>
      </header>

      <section className="dashboard-section">
        <div className="user-card">
          <h2>Your Profile</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
          <p><strong>Role:</strong> Patient</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => setShowBooking(true)}>Book Appointment</button>
          <button className="action-btn" onClick={handleViewRecords}>
            {showRecords ? 'Hide Records' : 'View Medical Records'}
          </button>
          <button className="action-btn" disabled title="Coming soon">Contact Doctor</button>
        </div>
      </section>

      {showRecords && (
        <section className="dashboard-section">
          <h2>Medical Records</h2>
          {recordsLoading ? (
            <p>Loading...</p>
          ) : records.length === 0 ? (
            <p className="no-appointments">No medical records found</p>
          ) : (
            <div className="records-list">
              {records.map(r => (
                <div key={r.id} className="record-item">
                  <div className="record-icon">📄</div>
                  <div className="record-info">
                    <span className="record-name">{r.file_name}</span>
                    <span className="record-type-badge">{r.record_type}</span>
                    {r.description && <p className="record-desc">{r.description}</p>}
                    <span className="record-date">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <a href={r.file_url} target="_blank" rel="noreferrer" className="record-download">
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="dashboard-section">
        <h2>Upcoming Appointments</h2>
        {loading ? (
          <p>Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="no-appointments">No upcoming appointments</p>
        ) : (
          <AppointmentsList appointments={appointments} onCancel={handleCancelAppointment} />
        )}
      </section>

      {showBooking && (
        <BookAppointmentModal onClose={() => setShowBooking(false)} onSuccess={handleAppointmentCreated} />
      )}
    </div>
  );
}
