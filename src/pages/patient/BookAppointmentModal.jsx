import { useState, useEffect } from 'react';
import { appointmentAPI, scheduleAPI, doctorAPI, facilityAPI } from '../../api';
import '../../styles/patient/BookAppointmentModal.css';

const asList = (data) => (Array.isArray(data) ? data : (data?.results || []));

export default function BookAppointmentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ slot_id: '', notes: '' });
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Doctor search/selection
  const [facilities, setFacilities] = useState([]);
  const [filters, setFilters] = useState({ specialization: '', facility: '' });
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    facilityAPI.list()
      .then((res) => setFacilities(asList(res.data)))
      .catch(() => setFacilities([]));
  }, []);

  const searchDoctors = async () => {
    setDoctorsLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.facility) params.facility = filters.facility;
      const res = await doctorAPI.search(params);
      setDoctors(asList(res.data));
    } catch (err) {
      console.error('Failed to search doctors:', err);
      setDoctors([]);
      setError('Nie udało się pobrać lekarzy.');
    } finally {
      setDoctorsLoading(false);
    }
  };

  const pickDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate('');
    setSlots([]);
    setFormData({ slot_id: '', notes: formData.notes });
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setError('');
    if (date && selectedDoctor) {
      setSlotsLoading(true);
      try {
        const response = await scheduleAPI.getAvailableSlots(selectedDoctor.user_id, date);
        setSlots(asList(response.data));
      } catch (err) {
        console.error('Failed to load slots:', err);
        setSlots([]);
        setError('Nie udało się załadować dostępnych terminów.');
      } finally {
        setSlotsLoading(false);
      }
    } else {
      setSlots([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!selectedDoctor) { setError('Wybierz lekarza.'); return; }
    if (!formData.slot_id) { setError('Wybierz termin.'); return; }

    setLoading(true);
    try {
      await appointmentAPI.create({ slot_id: formData.slot_id, notes: formData.notes });
      setSuccessMessage('Wizyta zarezerwowana!');
      setTimeout(() => onSuccess(), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Nie udało się utworzyć wizyty.');
      console.error('Error creating appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Umów wizytę</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          {/* Step 1: find & pick a doctor */}
          {!selectedDoctor && (
            <>
              <div className="form-group">
                <label htmlFor="specialization">Specjalizacja</label>
                <input
                  id="specialization"
                  type="text"
                  placeholder="np. Kardiolog"
                  value={filters.specialization}
                  onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="facility">Placówka</label>
                <select
                  id="facility"
                  value={filters.facility}
                  onChange={(e) => setFilters({ ...filters, facility: e.target.value })}
                >
                  <option value="">-- Dowolna --</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}{f.city ? ` (${f.city})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <button type="button" className="btn-primary" onClick={searchDoctors} disabled={doctorsLoading}>
                  {doctorsLoading ? 'Szukam...' : 'Szukaj lekarzy'}
                </button>
              </div>

              {doctors.length > 0 ? (
                <div className="users-grid" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  {doctors.map((d) => (
                    <div key={d.id} className="user-card" style={{ cursor: 'pointer' }} onClick={() => pickDoctor(d)}>
                      <div className="user-avatar">
                        {d.photo_url
                          ? <img src={d.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : (d.first_name?.charAt(0) || 'D')}
                      </div>
                      <div className="user-info">
                        <h3>Dr {d.first_name} {d.last_name}</h3>
                        <span className="user-role" style={{ backgroundColor: '#667eea' }}>{d.specialization}</span>
                        {d.facility_name && <p className="user-email">🏥 {d.facility_name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !doctorsLoading && <p className="no-slots">Wyszukaj, aby wybrać specjalistę.</p>
              )}
            </>
          )}

          {/* Step 2: pick a date + slot for the chosen doctor */}
          {selectedDoctor && (
            <>
              <div className="form-group">
                <label>Wybrany lekarz</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span><strong>Dr {selectedDoctor.first_name} {selectedDoctor.last_name}</strong> — {selectedDoctor.specialization}</span>
                  <button type="button" className="btn-secondary" onClick={() => setSelectedDoctor(null)}>Zmień</button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="date">Wybierz datę</label>
                <input type="date" id="date" value={selectedDate} onChange={handleDateChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="slot_id">Wybierz termin</label>
                {slotsLoading ? (
                  <p className="no-slots">Ładowanie terminów...</p>
                ) : selectedDate && slots.length > 0 ? (
                  <select id="slot_id" name="slot_id" value={formData.slot_id} onChange={handleInputChange} required>
                    <option value="">-- Wybierz godzinę --</option>
                    {slots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                ) : selectedDate ? (
                  <p className="no-slots">Brak wolnych terminów w tym dniu</p>
                ) : (
                  <p className="no-slots">Wybierz datę, aby zobaczyć terminy</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notatki (opcjonalnie)</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange}
                  placeholder="Dodatkowe informacje dla lekarza..." rows="3" />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>Anuluj</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Rezerwuję...' : 'Umów wizytę'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
