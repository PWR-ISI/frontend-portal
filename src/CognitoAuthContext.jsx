import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

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

  const signUp = async (email, password, firstName, lastName) => {
    try {
      // For MVP: Skip Cognito sign-up, just verify user exists
      // Production: Use Cognito.signUp() with email verification
      // For now: User should be pre-created in Cognito
      const result = await signIn(email, password);
      return { success: result.success, user: result.user };
    } catch (err) {
      console.error('Sign up error:', err);
      throw new Error('Registration failed. Please contact support or use test account: testuser@test.com / TestPassword123!');
    }
  };

  const signIn = async (email, password) => {
    try {
      // Use Cognito InitiateAuth API
      const cognitoResponse = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          ClientId: '61gdtpfg9436sqa8l50f664t83',
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        }),
      });

      if (!cognitoResponse.ok) {
        throw new Error('Login failed');
      }

      const data = await cognitoResponse.json();
      const tokens = data.AuthenticationResult;

      // Parse JWT to get user info
      const payload = JSON.parse(atob(tokens.IdToken.split('.')[1]));

      localStorage.setItem('id_token', tokens.IdToken);
      localStorage.setItem('access_token', tokens.AccessToken);
      localStorage.setItem('refresh_token', tokens.RefreshToken);
      localStorage.setItem('user_email', payload.email);
      localStorage.setItem('user_first_name', payload.given_name || 'User');
      localStorage.setItem('user_last_name', payload.family_name || '');
      localStorage.setItem('user_role', payload['custom:role'] || 'patient');

      setUser({
        email: payload.email,
        first_name: payload.given_name || 'User',
        last_name: payload.family_name || '',
        role: payload['custom:role'] || 'patient',
        id_token: tokens.IdToken,
        access_token: tokens.AccessToken,
        refresh_token: tokens.RefreshToken,
      });

      return {
        success: true,
        user: {
          email: payload.email,
          first_name: payload.given_name || 'User',
          last_name: payload.family_name || '',
          role: payload['custom:role'] || 'patient',
        },
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
