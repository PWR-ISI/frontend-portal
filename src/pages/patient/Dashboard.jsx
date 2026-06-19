import { useEffect, useState } from 'react';
import { useCognitoAuth } from '../../CognitoAuthContext';
import { appointmentAPI, medicalRecordAPI, doctorAPI } from '../../api';
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
      const [apptRes, docRes] = await Promise.all([
        appointmentAPI.list(),
        doctorAPI.search({}).catch(() => ({ data: [] })),
      ]);
      const doctors = Array.isArray(docRes.data) ? docRes.data : (docRes.data?.results || []);
      const nameById = {};
      doctors.forEach(d => { nameById[d.user_id] = `Dr ${d.first_name} ${d.last_name}`; });
      const list = Array.isArray(apptRes.data) ? apptRes.data : (apptRes.data?.results || []);
      setAppointments(list.map(a => ({ ...a, doctor_name: nameById[a.doctor_id] || 'Dr Anna Lekarz' })));
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
    if (window.confirm('Czy na pewno chcesz odwołać tę wizytę?')) {
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
        <h1>Witaj w portalu pacjenta</h1>
      </header>

      <section className="dashboard-section">
        <div className="user-card">
          <h2>Twój profil</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Imię i nazwisko:</strong> {user?.first_name} {user?.last_name}</p>
          <p><strong>Rola:</strong> Pacjent</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Szybkie akcje</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => setShowBooking(true)}>Umów wizytę</button>
          <button className="action-btn" onClick={handleViewRecords}>
            {showRecords ? 'Ukryj dokumentację' : 'Zobacz dokumentację medyczną'}
          </button>
          <button className="action-btn" disabled title="Wkrótce">Skontaktuj się z lekarzem</button>
        </div>
      </section>

      {showRecords && (
        <section className="dashboard-section">
          <h2>Dokumentacja medyczna</h2>
          {recordsLoading ? (
            <p>Ładowanie...</p>
          ) : records.length === 0 ? (
            <p className="no-appointments">Brak dokumentacji medycznej</p>
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
                    Pobierz
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="dashboard-section">
        <h2>Nadchodzące wizyty</h2>
        {loading ? (
          <p>Ładowanie...</p>
        ) : appointments.length === 0 ? (
          <p className="no-appointments">Brak nadchodzących wizyt</p>
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
