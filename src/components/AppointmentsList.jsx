import { useState, useEffect } from 'react';
import { fileUploadAPI } from '../api';
import '../styles/components/AppointmentsList.css';

function AppointmentDetailModal({ appointment, onClose }) {
  const [extraFiles, setExtraFiles] = useState([]);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fileUploadAPI.getForAppointment(appointment.id)
      .then(res => setExtraFiles(res.data || []))
      .catch(() => {});
  }, [appointment.id]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (file, source) => {
    setDownloading(file.id);
    try {
      if (source === 'appointment' && file.download_url) {
        window.open(file.download_url, '_blank');
      } else if (source === 'fileservice') {
        if (file.download_url) {
          window.open(file.download_url, '_blank');
        } else {
          const res = await fileUploadAPI.getShareUrl(file.id);
          window.open(res.data.download_url, '_blank');
        }
      }
    } catch (err) {
      alert('Failed to get download link. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // Use only file-upload service records to avoid duplicates
  // (files uploaded at booking time are stored in both services)
  const allFiles = extraFiles.map(f => ({ ...f, _source: 'fileservice' }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h2>Appointment Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div><strong>Date & Time:</strong> {formatDate(appointment.appointment_date)}</div>
          <div><strong>Doctor:</strong> {appointment.doctor_name || 'N/A'}</div>
          <div><strong>Patient:</strong> {appointment.patient_name || 'N/A'}</div>
          <div><strong>Type:</strong> {appointment.appointment_type || 'Regular'}</div>
          <div>
            <strong>Status:</strong>{' '}
            <span className={`status ${appointment.status.toLowerCase()}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>
          </div>
          {appointment.notes && (
            <div><strong>Notes:</strong> {appointment.notes}</div>
          )}

          <div>
            <strong>Files:</strong>
            {allFiles.length === 0 ? (
              <span style={{ color: '#888', marginLeft: '0.5rem' }}>No files attached</span>
            ) : (
              <table style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Size</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {allFiles.map(file => (
                    <tr key={file.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '6px 8px' }}>{file.original_name || 'file'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#666' }}>
                        {formatSize(file.size_bytes)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <button
                          className="btn-action btn-view"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          disabled={downloading === file.id}
                          onClick={() => handleDownload(file, file._source)}
                        >
                          {downloading === file.id ? '...' : '⬇ Download'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>
            ID: {appointment.id}
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '1rem', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsList({ appointments, onCancel }) {
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const getStatusClass = (status) => `status ${status.toLowerCase()}`;

  return (
    <>
      <div className="appointments-list">
        {appointments.length === 0 ? (
          <p className="empty-state">No appointments</p>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appointment => (
                <tr key={appointment.id}>
                  <td>{formatDate(appointment.appointment_date)}</td>
                  <td>{appointment.doctor_name || 'N/A'}</td>
                  <td>{appointment.patient_name || 'N/A'}</td>
                  <td>{appointment.appointment_type || 'Regular'}</td>
                  <td>
                    <span className={getStatusClass(appointment.status)}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action btn-view" onClick={() => setSelectedAppointment(appointment)}>
                      View
                    </button>
                    {appointment.status === 'scheduled' && (
                      <button className="btn-action btn-cancel" onClick={() => onCancel && onCancel(appointment.id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </>
  );
}
