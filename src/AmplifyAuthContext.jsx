import { createContext, useContext, useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut, getCurrentUser } from 'aws-amplify/auth';

// Configure Amplify for LocalStack or AWS
const isLocalStack = import.meta.env.VITE_COGNITO_DOMAIN?.includes('localhost');

Amplify.configure({
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      ...(isLocalStack && {
        identityPoolId: 'us-east-1:dummy-identity-pool',
        signUpVerificationMethod: 'code',
        endpoints: {
          CognitoIdentityServiceProvider: {
            endpoint: import.meta.env.VITE_COGNITO_DOMAIN,
          },
        },
      }),
    },
  },
  API: {
    endpoints: [
      {
        name: 'api',
        endpoint: import.meta.env.VITE_API_URL,
        region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
      },
    ],
  },
});

const AuthContext = createContext();

export function AmplifyAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser();
      setUser(user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email, password, firstName, lastName) => {
    try {
      const { userId } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
            'custom:role': 'patient',
          },
          autoSignIn: true,
        },
      });
      return { success: true, userId };
    } catch (err) {
      console.error('SignUp error:', err);
      throw err;
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      console.log('[Amplify] Attempting sign in with:', email);
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      console.log('[Amplify] Sign in result:', { isSignedIn, nextStep });

      if (isSignedIn) {
        const user = await getCurrentUser();
        setUser(user);
        return { success: true, user };
      }
      return { success: false, nextStep };
    } catch (err) {
      console.error('[Amplify] Sign in error:', err);
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp: handleSignUp, signIn: handleSignIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAmplifyAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAmplifyAuth must be used within AmplifyAuthProvider');
  }
  return context;
}
