import { useState } from 'react';
import { fileUploadAPI } from '../../api';
import '../../styles/patient/BookAppointmentModal.css';

export default function UploadFileModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }
    setLoading(true);
    setError('');
    try {
      await fileUploadAPI.upload(file, null);
      setSuccess('File uploaded successfully!');
      setTimeout(onSuccess, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload File</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="booking-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="form-group">
            <label>Select File</label>
            <label className="file-upload-label">
              <input type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0] || null)} />
              <span className="file-upload-btn">Choose file</span>
              <span className="file-upload-name">{file ? file.name : 'No file chosen'}</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
