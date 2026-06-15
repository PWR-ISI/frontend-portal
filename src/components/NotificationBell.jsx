import { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../api';
import '../styles/components/NotificationBell.css';

const TYPE_LABELS = {
  appointment_confirmed: 'Appointment Confirmed',
  appointment_cancelled: 'Appointment Cancelled',
  appointment_reminder: 'Reminder',
  payment_received: 'Payment Received',
  payment_failed: 'Payment Failed',
  medical_record_available: 'Record Available',
  system_alert: 'Alert',
  general: 'Notification',
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.unreadCount();
      setUnreadCount(res.data.unread_count || 0);
    } catch {}
  };

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const res = await notificationAPI.list();
      setNotifications(res.data.results || res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="notification-bell" ref={ref}>
      <button className="bell-btn" onClick={handleToggle} aria-label="Notifications">
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span className="notification-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-list">
            {loading ? (
              <p className="notif-empty">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="notif-empty">No notifications</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notification-item ${n.is_read ? 'read' : 'unread'}`}>
                  <div className="notif-content">
                    <span className="notif-type">{TYPE_LABELS[n.notification_type] || n.notification_type}</span>
                    <p className="notif-message">{n.message}</p>
                    <span className="notif-time">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  {!n.is_read && (
                    <button className="notif-read-btn" onClick={() => handleMarkRead(n.id)} title="Mark as read">
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
