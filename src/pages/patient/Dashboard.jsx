import { useCognitoAuth } from '../../CognitoAuthContext';
import '../../styles/patient/Dashboard.css';

export default function PatientDashboard() {
  const { user } = useCognitoAuth();

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
          <button className="action-btn">Book Appointment</button>
          <button className="action-btn">View Medical Records</button>
          <button className="action-btn">Contact Doctor</button>
          <button className="action-btn">View Prescriptions</button>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Upcoming Appointments</h2>
        <p className="no-appointments">No upcoming appointments</p>
      </section>
    </div>
  );
}
