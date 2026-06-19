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

const dayKey = (iso) => new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD (lokalnie)
const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeLabel = (iso) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState(null);

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

  // Group slots into days (sorted), each with its hours + available count.
  const byDay = {};
  for (const s of slots) {
    const k = dayKey(s.start_time);
    (byDay[k] || (byDay[k] = [])).push(s);
  }
  const days = Object.keys(byDay).sort().map((k) => {
    const daySlots = byDay[k].slice().sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return {
      key: k,
      label: dayLabel(daySlots[0].start_time),
      slots: daySlots,
      available: daySlots.filter((s) => s.status === 'available').length,
    };
  });

  return (
    <div className="doctor-dashboard">
      <header className="dashboard-header">
        <h1>Panel lekarza</h1>
      </header>

      <section className="today-appointments">
        <h2>Dzisiejsze wizyty ({todayAppointments.length})</h2>
        {loading ? (
          <p>Ładowanie...</p>
        ) : todayAppointments.length > 0 ? (
          <AppointmentsList appointments={todayAppointments} />
        ) : (
          <p className="no-appointments">Brak wizyt zaplanowanych na dziś</p>
        )}
      </section>

      <section className="upcoming-appointments">
        <h2>Nadchodzące wizyty ({scheduled.length})</h2>
        {loading ? (
          <p>Ładowanie...</p>
        ) : scheduled.length > 0 ? (
          <AppointmentsList appointments={scheduled} />
        ) : (
          <p className="no-appointments">Brak nadchodzących wizyt</p>
        )}
      </section>

      <section className="schedule-section">
        <h2>Mój grafik — wybierz dzień ({days.length})</h2>
        {loading ? (
          <p>Ładowanie...</p>
        ) : days.length === 0 ? (
          <p className="no-appointments">Brak terminów w grafiku</p>
        ) : (
          <div className="schedule-days">
            {days.map((d) => (
              <div key={d.key} className="schedule-day">
                <button
                  type="button"
                  className={`schedule-day-header ${openDay === d.key ? 'open' : ''}`}
                  onClick={() => setOpenDay(openDay === d.key ? null : d.key)}
                >
                  <span className="schedule-day-label">{d.label}</span>
                  <span className="schedule-day-count">
                    {d.available} wolnych · {d.slots.length} łącznie
                  </span>
                  <span className="schedule-day-caret">{openDay === d.key ? '▲' : '▼'}</span>
                </button>
                {openDay === d.key && (
                  <div className="schedule-hours">
                    {d.slots.map((s) => (
                      <span
                        key={s.id}
                        className={`hour-chip ${s.status === 'available' ? 'available' : 'booked'}`}
                        title={s.status === 'available' ? 'Wolny termin' : 'Zajęty'}
                      >
                        {timeLabel(s.start_time)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
