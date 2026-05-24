import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCognitoAuth } from '../CognitoAuthContext';
import '../styles/Login.css';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn } = useCognitoAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Hasła się nie zgadzają');
      return;
    }

    setLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.first_name, formData.last_name);
      const result = await signIn(formData.email, formData.password);
      if (result.success) {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Rejestracja nie powiodła się');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1>Rejestracja Pacjenta</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="first_name">Imię</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Nazwisko</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Hasło</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password_confirm">Potwierdź hasło</label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Rejestrowanie...' : 'Zarejestruj się'}
            </button>
          </form>

          <div className="login-links">
            <p>Masz już konto? <Link to="/login">Zaloguj się</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
