import { useState } from 'react';
import { scheduleAPI } from '../api';
import '../styles/components/Modal.css';

const PLACEHOLDER_FACILITY = '00000000-0000-0000-0000-000000000000';

// Pool of selectable half-hour slots (local time).
const POOL = (() => {
  const out = [];
  for (let h = 8; h < 18; h++) {
    for (const m of [0, 30]) out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return out;
})();

const asList = (d) => (Array.isArray(d) ? d : (d?.results || []));

function myDoctorId() {
  try {
    return JSON.parse(atob(localStorage.getItem('id_token').split('.')[1])).sub;
  } catch { return null; }
}

const hhmm = (iso) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

export default function CreateSlotsModal({ onClose, onSuccess }) {
  const doctorId = myDoctorId();
  const [date, setDate] = useState('');
  const [taken, setTaken] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [loadingDay, setLoadingDay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const onDateChange = async (e) => {
    const d = e.target.value;
    setDate(d); setSelected(new Set()); setError(''); setDone('');
    if (!d) { setTaken(new Set()); return; }
    setLoadingDay(true);
    try {
      const res = await scheduleAPI.getSlotsForDay(doctorId, d);
      setTaken(new Set(asList(res.data).map((s) => hhmm(s.start_time))));
    } catch {
      setTaken(new Set());
    } finally {
      setLoadingDay(false);
    }
  };

  const toggle = (t) => {
    if (taken.has(t)) return;
    const next = new Set(selected);
    next.has(t) ? next.delete(t) : next.add(t);
    setSelected(next);
  };

  const submit = async () => {
    if (!date) { setError('Wybierz dzień.'); return; }
    if (selected.size === 0) { setError('Zaznacz przynajmniej jedną godzinę.'); return; }
    setBusy(true); setError('');
    let ok = 0;
    for (const t of selected) {
      const [hh, mm] = t.split(':');
      const start = new Date(`${date}T${hh}:${mm}:00`);
      const end = new Date(start.getTime() + 30 * 60000);
      try {
        await scheduleAPI.createSlot({
          doctor_id: doctorId,
          facility_id: PLACEHOLDER_FACILITY,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        });
        ok += 1;
      } catch (err) {
        console.error('createSlot failed', t, err);
      }
    }
    setBusy(false);
    setDone(`Dodano ${ok} z ${selected.size} terminów.`);
    if (ok > 0) {
      onSuccess && onSuccess();
      setTimeout(() => onClose(), 900);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h2>Dodaj wolne terminy</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {error && <div className="error-message">{error}</div>}
          {done && <div className="success-message">{done}</div>}

          <div className="form-group">
            <label htmlFor="slot-date">Dzień</label>
            <input id="slot-date" type="date" value={date} onChange={onDateChange} />
          </div>

          {date && (
            <div className="form-group">
              <label>Godziny {loadingDay ? '(ładowanie...)' : `(zaznaczone: ${selected.size})`}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {POOL.map((t) => {
                  const isTaken = taken.has(t);
                  const isSel = selected.has(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggle(t)}
                      disabled={isTaken}
                      title={isTaken ? 'Termin już istnieje' : 'Kliknij, aby dodać'}
                      style={{
                        padding: '6px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 600,
                        cursor: isTaken ? 'not-allowed' : 'pointer',
                        border: '1px solid ' + (isSel ? '#16a085' : isTaken ? '#eee' : '#ccc'),
                        background: isTaken ? '#f1f1f1' : isSel ? '#16a085' : '#fff',
                        color: isTaken ? '#aaa' : isSel ? '#fff' : '#333',
                        textDecoration: isTaken ? 'line-through' : 'none',
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Anuluj</button>
          <button type="button" className="btn-submit" onClick={submit} disabled={busy || !date}>
            {busy ? 'Dodaję...' : `Dodaj zaznaczone (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
