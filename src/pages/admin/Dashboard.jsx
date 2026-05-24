import { useState, useEffect } from 'react';
import { userAPI, appointmentAPI } from '../../api';
import UsersList from '../../components/UsersList';
import CreateUserModal from '../../components/CreateUserModal';
import '../../styles/admin/Dashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, appointmentsRes] = await Promise.all([
        userAPI.list(),
        appointmentAPI.list(),
      ]);
      setUsers(usersRes.data);
      setAppointments(appointmentsRes.data);

      const newStats = {
        totalUsers: usersRes.data.length,
        totalPatients: usersRes.data.filter(u => u.role === 'patient').length,
        totalDoctors: usersRes.data.filter(u => u.role === 'doctor').length,
        totalAppointments: appointmentsRes.data.length,
        completedAppointments: appointmentsRes.data.filter(a => a.status === 'completed').length,
        cancelledAppointments: appointmentsRes.data.filter(a => a.status === 'cancelled').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Administration Dashboard</h1>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats.totalUsers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Patients</h3>
          <p className="stat-value">{stats.totalPatients || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Doctors</h3>
          <p className="stat-value">{stats.totalDoctors || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p className="stat-value">{stats.totalAppointments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">{stats.completedAppointments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Cancelled</h3>
          <p className="stat-value">{stats.cancelledAppointments || 0}</p>
        </div>
      </section>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          System
        </button>
      </div>

      {activeTab === 'users' && (
        <section className="users-section">
          <div className="section-header">
            <h2>All Users ({users.length})</h2>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Utwórz użytkownika
            </button>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : users.length > 0 ? (
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
            <div className="info-item">
              <span className="label">API Endpoint:</span>
              <span className="value">{import.meta.env.VITE_API_URL || 'http://localhost:8001'}</span>
            </div>
            <div className="info-item">
              <span className="label">Frontend Version:</span>
              <span className="value">1.0.0</span>
            </div>
            <div className="info-item">
              <span className="label">Environment:</span>
              <span className="value">{import.meta.env.MODE}</span>
            </div>
          </div>
        </section>
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
