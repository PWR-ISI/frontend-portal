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
      setError(err.message || 'Logowanie nie powiodło się');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>System Medyczny ISI</h1>
        <p className="subtitle">Zarządzanie wizytami lekarskimi</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adres email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Wpisz swój email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz swoje hasło"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="login-roles">
          <p className="roles-hint">Konta demonstracyjne:</p>
          <ul>
            <li><strong>Pacjent:</strong> patient@isi.test / Patient123!</li>
            <li><strong>Lekarz:</strong> kardiolog@isi.test / Doctor123!</li>
            <li><strong>Administrator:</strong> admin@isi.test / Admin123!</li>
          </ul>
        </div>

        <div className="login-links">
          <p>Nie masz konta? <Link to="/register">Zarejestruj się jako pacjent</Link></p>
        </div>
      </div>
    </div>
  );
}
