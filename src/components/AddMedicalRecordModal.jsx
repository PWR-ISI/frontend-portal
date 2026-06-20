import { useState } from 'react';
import { medicalRecordAPI } from '../api';
import '../styles/components/Modal.css';

const RECORD_TYPES = [
  'Wynik badania',
  'Recepta',
  'Skierowanie',
  'Karta informacyjna z wizyty',
  'Zalecenia',
  'Inny dokument',
];

// Doctor/clerk adds a medical document for the patient of a given appointment.
// (BPMN: VisitFinishingDoctor — doctor records post-visit documentation.)
export default function AddMedicalRecordModal({ appointment, onClose, onSuccess }) {
  const [recordType, setRecordType] = useState(RECORD_TYPES[0]);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const patientId = appointment?.patient_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) { setError('Wybierz plik dokumentu.'); return; }
    if (!patientId) { setError('Brak identyfikatora pacjenta.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('patient_id', patientId);
      fd.append('record_type', recordType);
      fd.append('description', description);
      if (appointment?.id) fd.append('appointment_id', appointment.id);
      await medicalRecordAPI.upload(fd);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || 'Nie udało się dodać dokumentu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Dodaj dokumentację medyczną</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Pacjent</label>
            <input type="text" value={appointment?.patient_name || patientId || ''} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="record_type">Rodzaj dokumentu *</label>
            <select id="record_type" value={recordType} onChange={(e) => setRecordType(e.target.value)} required>
              {RECORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">Opis</label>
            <textarea id="description" rows="3" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="np. rozpoznanie, zalecenia..." />
          </div>
          <div className="form-group">
            <label htmlFor="file">Plik *</label>
            <input id="file" type="file" onChange={(e) => setFile(e.target.files[0] || null)} required />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Anuluj</button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Dodaję...' : 'Dodaj dokument'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
