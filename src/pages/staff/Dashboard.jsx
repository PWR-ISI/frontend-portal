import { useState, useEffect } from 'react';
import { appointmentAPI, userAPI } from '../../api';
import AppointmentsList from '../../components/AppointmentsList';
import UsersList from '../../components/UsersList';
import CreateUserModal from '../../components/CreateUserModal';
import AddDoctorModal from '../../components/AddDoctorModal';
import BookAppointmentModal from '../patient/BookAppointmentModal';
import '../../styles/staff/Dashboard.css';

const asList = (d) => (Array.isArray(d) ? d : (d?.results || []));

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointmentsRes, usersRes] = await Promise.all([
        appointmentAPI.list(),
        userAPI.list(),
      ]);
      setAppointments(asList(appointmentsRes.data));
      setPatients(asList(usersRes.data).filter(u => u.role === 'patient'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id, reason) => {
    try { await appointmentAPI.cancel(id, reason); fetchData(); }
    catch (err) { console.error('Cancel failed:', err); }
  };

  const handleComplete = async (id, summary) => {
    try { await appointmentAPI.complete(id, summary); fetchData(); }
    catch (err) { console.error('Complete failed:', err); }
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
          <div className="section-header">
            <h2>Wszystkie wizyty</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" onClick={() => setShowBooking(true)}>+ Umów wizytę</button>
              <button className="btn-primary" onClick={() => setShowAddDoctor(true)}>+ Dodaj lekarza</button>
            </div>
          </div>
          {loading ? (
            <p>Ładowanie...</p>
          ) : appointments.length > 0 ? (
            <AppointmentsList appointments={appointments} onCancel={handleCancel} onComplete={handleComplete} />
          ) : (
            <p className="no-appointments">Brak wizyt</p>
          )}
        </section>
      )}

      {activeTab === 'patients' && (
        <section className="patients-section">
          <div className="section-header">
            <h2>Zarejestrowani pacjenci ({patients.length})</h2>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
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
          onSuccess={fetchData}
        />
      )}
      {showAddDoctor && (
        <AddDoctorModal
          onClose={() => setShowAddDoctor(false)}
          onSuccess={() => { setShowAddDoctor(false); fetchData(); }}
        />
      )}
      {showBooking && (
        <BookAppointmentModal
          patients={patients}
          onClose={() => setShowBooking(false)}
          onSuccess={() => { setShowBooking(false); fetchData(); }}
        />
      )}
    </div>
  );
}
