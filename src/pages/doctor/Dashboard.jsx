import { useState, useEffect } from 'react';
import { appointmentAPI, scheduleAPI } from '../../api';
import AppointmentsList from '../../components/AppointmentsList';
import '../../styles/doctor/Dashboard.css';

const asList = (d) => (Array.isArray(d) ? d : (d?.results || []));

function myDoctorId() {
  try {
    const t = localStorage.getItem('id_token');
    return JSON.parse(atob(t.split('.')[1])).sub;
  } catch {
    return null;
  }
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const docId = myDoctorId();
    // Resilient: one call failing must not blank the others.
    const [apptRes, slotRes] = await Promise.allSettled([
      appointmentAPI.list(),
      docId ? scheduleAPI.getDoctorSlots(docId) : Promise.resolve({ data: [] }),
    ]);
    if (apptRes.status === 'rejected') console.error('Failed to load appointments:', apptRes.reason);
    setAppointments(apptRes.status === 'fulfilled' ? asList(apptRes.value.data) : []);
    setSlots(slotRes.status === 'fulfilled' ? asList(slotRes.value.data) : []);
    setLoading(false);
  };

  const scheduled = appointments.filter((a) => a.status === 'scheduled');
  const todayAppointments = scheduled.filter(
    (a) => new Date(a.appointment_date).toDateString() === new Date().toDateString()
  );

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
          <AppointmentsList appointments={todayAppointments} />
        ) : (
          <p className="no-appointments">No appointments scheduled for today</p>
        )}
      </section>

      <section className="upcoming-appointments">
        <h2>Upcoming Appointments ({scheduled.length})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : scheduled.length > 0 ? (
          <AppointmentsList appointments={scheduled} />
        ) : (
          <p className="no-appointments">No upcoming appointments</p>
        )}
      </section>

      <section className="schedule-section">
        <h2>My Available Slots ({slots.length})</h2>
        {slots.length === 0 ? (
          <p className="no-appointments">No available slots</p>
        ) : (
          <div className="schedule-grid">
            {slots.slice(0, 60).map((s) => (
              <div key={s.id} className="schedule-slot">
                <span className="slot-day">{new Date(s.start_time).toLocaleDateString()}</span>
                <span className="slot-time">
                  {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`slot-status ${s.status === 'available' ? 'available' : 'booked'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
