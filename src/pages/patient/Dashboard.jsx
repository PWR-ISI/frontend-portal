import { useState, useEffect } from 'react';
import { appointmentAPI } from '../../api';
import AppointmentsList from '../../components/AppointmentsList';
import '../../styles/patient/Dashboard.css';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.list();
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-dashboard">
      <header className="dashboard-header">
        <h1>My Appointments</h1>
        <button className="btn-primary">Book New Appointment</button>
      </header>

      <section className="appointments-section">
        <h2>Upcoming Appointments</h2>
        {loading ? (
          <p>Loading...</p>
        ) : appointments.length > 0 ? (
          <AppointmentsList appointments={appointments.filter(a => a.status === 'scheduled')} />
        ) : (
          <p className="no-appointments">No upcoming appointments</p>
        )}
      </section>

      <section className="appointments-section">
        <h2>Past Appointments</h2>
        {appointments.length > 0 ? (
          <AppointmentsList appointments={appointments.filter(a => a.status === 'completed')} />
        ) : (
          <p className="no-appointments">No past appointments</p>
        )}
      </section>
    </div>
  );
}
