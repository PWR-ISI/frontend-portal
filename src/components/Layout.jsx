import { useCognitoAuth } from '../CognitoAuthContext';
import { useNavigate } from 'react-router-dom';
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
      patient: 'Patient Portal',
      doctor: 'Doctor Portal',
      staff: 'Staff Portal',
      admin: 'Admin Portal',
    };
    return labels[role] || 'Portal';
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>ISI Medical System</h1>
          <span className="role-badge">{getRoleLabel(user?.role)}</span>
        </div>

        <div className="navbar-menu">
          <span className="user-info">Welcome, {user?.email}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="main-content">
        {children}
      </div>

      <footer className="footer">
        <p>&copy; 2026 ISI Medical System. All rights reserved.</p>
      </footer>
    </div>
  );
}
