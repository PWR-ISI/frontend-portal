import { useState, useEffect } from 'react';
import { appointmentAPI, scheduleAPI } from '../../api';
import AppointmentsList from '../../components/AppointmentsList';
import '../../styles/doctor/Dashboard.css';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, scheduleRes] = await Promise.all([
        appointmentAPI.list(),
        scheduleAPI.list(),
      ]);
      setAppointments(appointmentsRes.data);
      setSchedule(scheduleRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayAppointments = appointments.filter(a => {
    const apptDate = new Date(a.appointment_date).toDateString();
    const today = new Date().toDateString();
    return apptDate === today && a.status === 'scheduled';
  });

  return (
    <div className="doctor-dashboard">
      <header className="dashboard-header">
        <h1>Doctor Dashboard</h1>
      </header>

      <section className="today-appointments">
        <h2>Today's Appointments ({todayAppointments.length})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : todayAppointments.length > 0 ? (
          <AppointmentsList appointments={todayAppointments} detailed={true} />
        ) : (
          <p className="no-appointments">No appointments scheduled for today</p>
        )}
      </section>

      <section className="upcoming-appointments">
        <h2>Upcoming Appointments</h2>
        {appointments.length > 0 ? (
          <AppointmentsList appointments={appointments.filter(a => a.status === 'scheduled')} />
        ) : (
          <p className="no-appointments">No upcoming appointments</p>
        )}
      </section>

      <section className="schedule-section">
        <h2>My Schedule</h2>
        <div className="schedule-grid">
          {schedule.map(slot => (
            <div key={slot.id} className="schedule-slot">
              <span className="slot-day">{new Date(slot.date).toLocaleDateString()}</span>
              <span className="slot-time">{slot.start_time} - {slot.end_time}</span>
              <span className={`slot-status ${slot.available ? 'available' : 'booked'}`}>
                {slot.available ? 'Available' : 'Booked'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
