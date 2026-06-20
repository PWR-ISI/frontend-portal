import { useState, useEffect } from 'react';
import { userAPI, appointmentAPI, doctorAPI, facilityAPI } from '../../api';
import UsersList from '../../components/UsersList';
import AppointmentsList from '../../components/AppointmentsList';
import CreateUserModal from '../../components/CreateUserModal';
import EditUserModal from '../../components/EditUserModal';
import AddDoctorModal from '../../components/AddDoctorModal';
import AddFacilityModal from '../../components/AddFacilityModal';
import '../../styles/admin/Dashboard.css';

const asList = (data) => (Array.isArray(data) ? data : (data?.results || []));

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleCancelAppt = async (id, reason) => {
    try { await appointmentAPI.cancel(id, reason); fetchData(); }
    catch (e) { console.error('Cancel failed:', e); }
  };

  const handleCompleteAppt = async (id, summary) => {
    try { await appointmentAPI.complete(id, summary); fetchData(); }
    catch (e) { console.error('Complete failed:', e); }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Usunąć użytkownika ${user.first_name} ${user.last_name} (${user.email})?`)) return;
    try {
      await userAPI.delete(user.id);
      // A doctor's catalog profile lives in facility-staff — remove it too so the doctor
      // doesn't linger in the "Lekarze" tab after the account is gone.
      if (user.role === 'doctor' && user.cognito_sub) {
        try {
          const profiles = await doctorAPI.searchAll();
          const prof = profiles.find((d) => d.user_id === user.cognito_sub);
          if (prof) await doctorAPI.deleteProfile(prof.id);
        } catch (e) {
          console.error('Failed to delete doctor profile:', e);
        }
      }
      fetchData();
    } catch (e) {
      window.alert(e.response?.data?.detail || 'Nie udało się usunąć użytkownika.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchDoctors = async () => {
    try {
      setDoctors(await doctorAPI.adminListAll());
    } catch (e) {
      console.error('Failed to fetch doctors:', e);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await facilityAPI.list();
      setFacilities(asList(res.data));
    } catch (e) {
      console.error('Failed to fetch facilities:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    // Fetch independently so one failing endpoint doesn't blank the page.
    // userAPI.listAll / doctorAPI.adminListAll follow pagination and return arrays.
    const [usersRes, apptRes, docRes, facRes] = await Promise.allSettled([
      userAPI.listAll(),
      appointmentAPI.list(),
      doctorAPI.adminListAll(),
      facilityAPI.list(),
    ]);

    const u = usersRes.status === 'fulfilled' ? usersRes.value : [];
    const a = apptRes.status === 'fulfilled' ? asList(apptRes.value.data) : [];
    const d = docRes.status === 'fulfilled' ? docRes.value : [];
    const f = facRes.status === 'fulfilled' ? asList(facRes.value.data) : [];
    setUsers(u);
    setAppointments(a);
    setDoctors(d);
    setFacilities(f);
    setStats({
      totalUsers: u.length,
      totalPatients: u.filter((x) => x.role === 'patient').length,
      totalDoctors: d.length,
      totalAppointments: a.length,
      completedAppointments: a.filter((x) => x.status === 'completed').length,
      cancelledAppointments: a.filter((x) => x.status === 'cancelled').length,
    });
    setLoading(false);
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Panel administratora</h1>
      </header>

      <section className="stats-grid">
        <div className="stat-card"><h3>Wszyscy użytkownicy</h3><p className="stat-value">{stats.totalUsers || 0}</p></div>
        <div className="stat-card"><h3>Pacjenci</h3><p className="stat-value">{stats.totalPatients || 0}</p></div>
        <div className="stat-card"><h3>Lekarze</h3><p className="stat-value">{stats.totalDoctors || 0}</p></div>
        <div className="stat-card"><h3>Wszystkie wizyty</h3><p className="stat-value">{stats.totalAppointments || 0}</p></div>
        <div className="stat-card"><h3>Zakończone</h3><p className="stat-value">{stats.completedAppointments || 0}</p></div>
        <div className="stat-card"><h3>Odwołane</h3><p className="stat-value">{stats.cancelledAppointments || 0}</p></div>
      </section>

      <div className="tabs">
        <button className={`tab ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')}>Lekarze</button>
        <button className={`tab ${activeTab === 'facilities' ? 'active' : ''}`} onClick={() => setActiveTab('facilities')}>Placówki</button>
        <button className={`tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>Wizyty</button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Użytkownicy</button>
        <button className={`tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>System</button>
      </div>

      {activeTab === 'doctors' && (
        <section className="users-section">
          <div className="section-header">
            <h2>Lekarze ({doctors.length})</h2>
            <button className="btn-primary" onClick={() => setShowAddDoctor(true)}>+ Dodaj lekarza</button>
          </div>
          {loading ? (
            <p>Ładowanie...</p>
          ) : doctors.length > 0 ? (
            <div className="users-grid">
              {doctors.map((d) => (
                <div key={d.id} className="user-card">
                  <div className="user-avatar">
                    {d.photo_url
                      ? <img src={d.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : (d.first_name?.charAt(0) || 'D')}
                  </div>
                  <div className="user-info">
                    <h3>Dr {d.first_name} {d.last_name}</h3>
                    <p className="user-email">{d.email}</p>
                    <span className="user-role" style={{ backgroundColor: '#667eea' }}>{d.specialization}</span>
                    {d.facility_name && <p className="user-email">🏥 {d.facility_name}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Brak lekarzy. Dodaj pierwszego.</p>
          )}
        </section>
      )}

      {activeTab === 'facilities' && (
        <section className="users-section">
          <div className="section-header">
            <h2>Placówki ({facilities.length})</h2>
            <button className="btn-primary" onClick={() => setShowAddFacility(true)}>+ Dodaj placówkę</button>
          </div>
          {loading ? (
            <p>Ładowanie...</p>
          ) : facilities.length > 0 ? (
            <div className="users-grid">
              {facilities.map((f) => (
                <div key={f.id} className="user-card">
                  <div className="user-avatar">🏥</div>
                  <div className="user-info">
                    <h3>{f.name}</h3>
                    <p className="user-email">{f.address}{f.city ? `, ${f.city}` : ''}</p>
                    {f.phone && <p className="user-email">📞 {f.phone}</p>}
                    {f.email && <p className="user-email">✉️ {f.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Brak placówek. Dodaj pierwszą.</p>
          )}
        </section>
      )}

      {activeTab === 'appointments' && (
        <section className="users-section">
          <div className="section-header">
            <h2>Wszystkie wizyty ({appointments.length})</h2>
          </div>
          {loading ? (
            <p>Ładowanie...</p>
          ) : appointments.length > 0 ? (
            <AppointmentsList appointments={appointments} onCancel={handleCancelAppt} onComplete={handleCompleteAppt} />
          ) : (
            <p className="no-data">Brak wizyt w systemie</p>
          )}
        </section>
      )}

      {activeTab === 'users' && (
        <section className="users-section">
          <div className="section-header">
            <h2>Wszyscy użytkownicy ({users.length})</h2>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Utwórz użytkownika</button>
          </div>
          {loading ? <p>Ładowanie...</p> : users.length > 0 ? (
            <UsersList users={users} canDelete={true} onEdit={setEditingUser} onDelete={handleDeleteUser} />
          ) : (
            <p className="no-data">Brak użytkowników</p>
          )}
        </section>
      )}

      {activeTab === 'system' && (
        <section className="system-section">
          <h2>Informacje o systemie</h2>
          <div className="system-info">
            <div className="info-item"><span className="label">API uwierzytelniania:</span><span className="value">{import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001/api/v2'}</span></div>
            <div className="info-item"><span className="label">API placówek:</span><span className="value">{import.meta.env.VITE_FACILITY_SERVICE_URL || 'http://localhost:8005'}</span></div>
            <div className="info-item"><span className="label">Środowisko:</span><span className="value">{import.meta.env.MODE}</span></div>
          </div>
        </section>
      )}

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={fetchData} />
      )}
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={fetchData} />
      )}
      {showAddDoctor && (
        <AddDoctorModal onClose={() => setShowAddDoctor(false)} onSuccess={() => { setShowAddDoctor(false); fetchDoctors(); }} />
      )}
      {showAddFacility && (
        <AddFacilityModal onClose={() => setShowAddFacility(false)} onSuccess={() => { setShowAddFacility(false); fetchFacilities(); }} />
      )}
    </div>
  );
}
