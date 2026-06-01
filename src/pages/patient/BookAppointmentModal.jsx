import { useState } from 'react';
import { appointmentAPI, scheduleAPI, fileUploadAPI } from '../../api';
import '../../styles/patient/BookAppointmentModal.css';

export default function BookAppointmentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    slot_id: '',
    notes: '',
    file: null,
  });
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const HARDCODED_DOCTOR_ID = '00000000-0000-0000-0000-000000000001';

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setError('');

    if (date) {
      setSlotsLoading(true);
      try {
        const response = await scheduleAPI.getAvailableSlots(HARDCODED_DOCTOR_ID, date);
        setSlots(response.data || []);
      } catch (err) {
        console.error('Failed to load slots:', err);
        setSlots([]);
        setError('Failed to load available slots. Please try again.');
      } finally {
        setSlotsLoading(false);
      }
    } else {
      setSlots([]);
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] || null });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.slot_id) {
      setError('Please select a time slot');
      setLoading(false);
      return;
    }

    try {
      const appointmentData = {
        slot_id: formData.slot_id,
        notes: formData.notes,
        file: formData.file,
      };

      const response = await appointmentAPI.create(appointmentData);
      const appointmentId = response.data.id;

      if (formData.file) {
        try {
          await fileUploadAPI.upload(formData.file, appointmentId);
        } catch (uploadErr) {
          console.warn('Appointment created but file attachment failed:', uploadErr);
        }
      }

      setSuccessMessage('Appointment booked successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || 'Failed to create appointment';
      setError(errorDetail);
      console.error('Error creating appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Appointment</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <div className="form-group">
            <label htmlFor="date">Select Date</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={handleDateChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="slot_id">Select Time Slot</label>
            {slotsLoading ? (
              <p className="no-slots">Loading available slots...</p>
            ) : selectedDate && slots.length > 0 ? (
              <select
                id="slot_id"
                name="slot_id"
                value={formData.slot_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select a time --</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {new Date(slot.start_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </option>
                ))}
              </select>
            ) : selectedDate ? (
              <p className="no-slots">No available slots for this date</p>
            ) : (
              <p className="no-slots">Select a date to see available slots</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional information for the doctor..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Attach File (Optional)</label>
            <label className="file-upload-label">
              <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
              <span className="file-upload-btn">Choose file</span>
              <span className="file-upload-name">{formData.file ? formData.file.name : 'No file chosen'}</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
