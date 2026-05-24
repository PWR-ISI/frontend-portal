import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCognitoAuth } from '../CognitoAuthContext';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useCognitoAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.success) {
        navigate(`/${result.user.role.toLowerCase()}/dashboard`);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>ISI Medical System</h1>
        <p className="subtitle">Medical Appointment Management</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-roles">
          <p className="roles-hint">Demo Credentials:</p>
          <ul>
            <li><strong>Patient:</strong> patient@example.com</li>
            <li><strong>Doctor:</strong> doctor@example.com</li>
            <li><strong>Staff:</strong> staff@example.com</li>
            <li><strong>Admin:</strong> admin@example.com</li>
          </ul>
        </div>

        <div className="login-links">
          <p>Nie masz konta? <Link to="/register">Zarejestruj się jako pacjent</Link></p>
        </div>
      </div>
    </div>
  );
}
