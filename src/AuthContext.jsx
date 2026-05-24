import { createContext, useContext, useState, useEffect } from 'react';
import { getTokenRole } from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const role = getTokenRole();
      setUser({ token, role });
    }
    setLoading(false);
  }, []);

  const login = (token, role) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    setUser({ token, role });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
