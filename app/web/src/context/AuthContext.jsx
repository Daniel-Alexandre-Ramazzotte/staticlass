import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { appUrl } from '../utils/paths.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState('aluno');
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored) {
      try {
        const decoded = jwtDecode(stored);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(stored);
          setRole(decoded.role);
          setUserId(decoded.sub);
          setEmail(decoded.email);
          setName(decoded.name);
          const override = localStorage.getItem('@email_verified_override');
          setEmailVerified(override === 'true' ? true : (decoded.email_verified ?? true));
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  function signIn(newToken) {
    const decoded = jwtDecode(newToken);
    setToken(newToken);
    setRole(decoded.role);
    setUserId(decoded.sub);
    setEmail(decoded.email);
    setName(decoded.name);
    const override = localStorage.getItem('@email_verified_override');
    setEmailVerified(override === 'true' ? true : (decoded.email_verified ?? true));
    localStorage.setItem('auth_token', newToken);
  }

  function markEmailVerified() {
    setEmailVerified(true);
    localStorage.setItem('@email_verified_override', 'true');
  }

  function signOut() {
    setToken(null);
    setRole('aluno');
    setUserId(null);
    setEmail(null);
    setName(null);
    setEmailVerified(true);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('@email_verified_override');
    window.location.href = appUrl('/login');
  }

  return (
    <AuthContext.Provider value={{ token, role, userId, email, name, emailVerified, isLoading, signIn, signOut, markEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
