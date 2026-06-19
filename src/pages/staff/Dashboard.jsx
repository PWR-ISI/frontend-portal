import { useState, useEffect } from 'react';
import { appointmentAPI, userAPI } from '../../api';
import AppointmentsList from '../../components/AppointmentsList';
import UsersList from '../../components/UsersList';
import CreateUserModal from '../../components/CreateUserModal';
import '../../styles/staff/Dashboard.css';

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, usersRes] = await Promise.all([
        appointmentAPI.list(),
        userAPI.list(),
      ]);
      setAppointments(appointmentsRes.data);
      setPatients(usersRes.data.filter(u => u.role === 'patient'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-dashboard">
      <header className="dashboard-header">
        <h1>Panel personelu rejestracji</h1>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Wizyty
        </button>
        <button
          className={`tab ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          Pacjenci
        </button>
      </div>

      {activeTab === 'appointments' && (
        <section className="appointments-section">
          <h2>Wszystkie wizyty</h2>
          {loading ? (
            <p>Ładowanie...</p>
          ) : appointments.length > 0 ? (
            <AppointmentsList appointments={appointments} detailed={true} />
          ) : (
            <p className="no-appointments">Brak wizyt</p>
          )}
        </section>
      )}

      {activeTab === 'patients' && (
        <section className="patients-section">
          <div className="section-header">
            <h2>Zarejestrowani pacjenci ({patients.length})</h2>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Utwórz pacjenta
            </button>
          </div>
          {loading ? (
            <p>Ładowanie...</p>
          ) : patients.length > 0 ? (
            <UsersList users={patients} />
          ) : (
            <p className="no-data">Brak zarejestrowanych pacjentów</p>
          )}
        </section>
      )}

      {showCreateModal && (
        <CreateUserModal
          roles={['patient']}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
