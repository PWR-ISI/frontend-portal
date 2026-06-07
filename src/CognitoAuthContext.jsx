import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001/api/v2';

export function CognitoAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('id_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          email: payload.email || localStorage.getItem('user_email'),
          first_name: payload.given_name || localStorage.getItem('user_first_name'),
          last_name: payload.family_name || localStorage.getItem('user_last_name'),
          role: payload['custom:role'] || localStorage.getItem('user_role') || 'patient',
          id_token: token,
          access_token: localStorage.getItem('access_token'),
          refresh_token: localStorage.getItem('refresh_token'),
        });
      }
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('id_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, passwordConfirm, firstName, lastName, role = 'patient') => {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          password_confirm: passwordConfirm,
          first_name: firstName,
          last_name: lastName,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();

      localStorage.setItem('id_token', data.id_token);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_email', data.user.email);
      localStorage.setItem('user_first_name', data.user.first_name || firstName);
      localStorage.setItem('user_last_name', data.user.last_name || lastName);
      localStorage.setItem('user_role', data.user.role || role);

      setUser({
        email: data.user.email,
        first_name: data.user.first_name || firstName,
        last_name: data.user.last_name || lastName,
        role: data.user.role || role,
        id_token: data.id_token,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      return {
        success: true,
        user: data.user,
      };
    } catch (err) {
      console.error('Sign up error:', err);
      throw new Error(`Registration failed: ${err.message}`);
    }
  };

  const signIn = async (email, password) => {
    try {
      // Call auth service API instead of Cognito directly
      const response = await fetch(`${AUTH_SERVICE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      localStorage.setItem('id_token', data.id_token);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_email', data.user.email);
      localStorage.setItem('user_first_name', data.user.first_name || 'User');
      localStorage.setItem('user_last_name', data.user.last_name || '');
      localStorage.setItem('user_role', data.user.role || 'patient');

      setUser({
        email: data.user.email,
        first_name: data.user.first_name || 'User',
        last_name: data.user.last_name || '',
        role: data.user.role || 'patient',
        id_token: data.id_token,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      return {
        success: true,
        user: data.user,
      };
    } catch (err) {
      console.error('Sign in error:', err);
      throw new Error('Login failed. Use: testuser@test.com / TestPassword123!');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_first_name');
    localStorage.removeItem('user_last_name');
    localStorage.removeItem('user_role');
    setUser(null);
  };

  const logout = signOut;

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, signIn, signOut, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCognitoAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useCognitoAuth must be used within CognitoAuthProvider');
  }
  return context;
}
