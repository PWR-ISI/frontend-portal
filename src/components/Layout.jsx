import { useCognitoAuth } from '../CognitoAuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import '../styles/components/Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useCognitoAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    const labels = {
      patient: 'Portal pacjenta',
      doctor: 'Portal lekarza',
      staff: 'Portal personelu',
      admin: 'Portal administratora',
    };
    return labels[role] || 'Portal';
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>System Medyczny ISI</h1>
          <span className="role-badge">{getRoleLabel(user?.role)}</span>
        </div>

        <div className="navbar-menu">
          <span className="user-info">Witaj, {user?.email}</span>
          <NotificationBell />
          <button className="btn-logout" onClick={handleLogout}>
            Wyloguj
          </button>
        </div>
      </nav>

      <div className="main-content">
        {children}
      </div>

      <footer className="footer">
        <p>&copy; 2026 System Medyczny ISI. Wszelkie prawa zastrzeżone.</p>
      </footer>
    </div>
  );
}
