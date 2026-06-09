import { useState, useEffect } from 'react';
import { userAPI, appointmentAPI, doctorAPI } from '../../api';
import UsersList from '../../components/UsersList';
import CreateUserModal from '../../components/CreateUserModal';
import AddDoctorModal from '../../components/AddDoctorModal';
import '../../styles/admin/Dashboard.css';

const asList = (data) => (Array.isArray(data) ? data : (data?.results || []));

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await doctorAPI.adminList();
      setDoctors(asList(res.data));
    } catch (e) {
      console.error('Failed to fetch doctors:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    // Fetch independently so one failing endpoint doesn't blank the page.
    const [usersRes, apptRes, docRes] = await Promise.allSettled([
      userAPI.list(),
      appointmentAPI.list(),
      doctorAPI.adminList(),
    ]);

    const u = usersRes.status === 'fulfilled' ? asList(usersRes.value.data) : [];
    const a = apptRes.status === 'fulfilled' ? asList(apptRes.value.data) : [];
    const d = docRes.status === 'fulfilled' ? asList(docRes.value.data) : [];
    setUsers(u);
    setAppointments(a);
    setDoctors(d);
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
        <h1>Administration Dashboard</h1>
      </header>

      <section className="stats-grid">
        <div className="stat-card"><h3>Total Users</h3><p className="stat-value">{stats.totalUsers || 0}</p></div>
        <div className="stat-card"><h3>Patients</h3><p className="stat-value">{stats.totalPatients || 0}</p></div>
        <div className="stat-card"><h3>Doctors</h3><p className="stat-value">{stats.totalDoctors || 0}</p></div>
        <div className="stat-card"><h3>Total Appointments</h3><p className="stat-value">{stats.totalAppointments || 0}</p></div>
        <div className="stat-card"><h3>Completed</h3><p className="stat-value">{stats.completedAppointments || 0}</p></div>
        <div className="stat-card"><h3>Cancelled</h3><p className="stat-value">{stats.cancelledAppointments || 0}</p></div>
      </section>

      <div className="tabs">
        <button className={`tab ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')}>Lekarze</button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Management</button>
        <button className={`tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>System</button>
      </div>

      {activeTab === 'doctors' && (
        <section className="users-section">
          <div className="section-header">
            <h2>Lekarze ({doctors.length})</h2>
            <button className="btn-primary" onClick={() => setShowAddDoctor(true)}>+ Dodaj lekarza</button>
          </div>
          {loading ? (
            <p>Loading...</p>
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

      {activeTab === 'users' && (
        <section className="users-section">
          <div className="section-header">
            <h2>All Users ({users.length})</h2>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Utwórz użytkownika</button>
          </div>
          {loading ? <p>Loading...</p> : users.length > 0 ? (
            <UsersList users={users} canDelete={true} />
          ) : (
            <p className="no-data">No users found</p>
          )}
        </section>
      )}

      {activeTab === 'system' && (
        <section className="system-section">
          <h2>System Information</h2>
          <div className="system-info">
            <div className="info-item"><span className="label">Auth API:</span><span className="value">{import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001/api/v2'}</span></div>
            <div className="info-item"><span className="label">Facility API:</span><span className="value">{import.meta.env.VITE_FACILITY_SERVICE_URL || 'http://localhost:8005'}</span></div>
            <div className="info-item"><span className="label">Environment:</span><span className="value">{import.meta.env.MODE}</span></div>
          </div>
        </section>
      )}

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={fetchData} />
      )}
      {showAddDoctor && (
        <AddDoctorModal onClose={() => setShowAddDoctor(false)} onSuccess={() => { setShowAddDoctor(false); fetchDoctors(); }} />
      )}
    </div>
  );
}
