import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
type UserRole = 'aluno' | 'professor' | 'admin';

interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
  exp: number;
  name: string;
  email_verified?: boolean;
}

interface AuthContextProps {
  session: string | null;
  role: UserRole;
  email: string | null;
  name: string | null;
  userId: string | null;
  isLoading: boolean;
  emailVerified: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  markEmailVerified: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('aluno');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedSession = await AsyncStorage.getItem('@auth_session');

        if (storedSession) {
          const decoded = jwtDecode<JwtPayload>(storedSession);
          const isExpired = decoded.exp * 1000 < Date.now();

          if (!isExpired) {
            setSession(storedSession);
            setRole(decoded.role);
            setEmail(decoded.email);
            setName(decoded.name);
            setUserId(decoded.sub);

            const override = await AsyncStorage.getItem('@email_verified_override');
            setEmailVerified(override === 'true' ? true : (decoded.email_verified ?? true));
          } else {
            await signOut();
          }
        }
      } catch (error) {
        console.log('Erro ao ler token', error);
        await signOut();
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  async function signIn(token: string) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setSession(token);
      setRole(decoded.role);
      setEmail(decoded.email);
      setName(decoded.name);
      setUserId(decoded.sub);

      const override = await AsyncStorage.getItem('@email_verified_override');
      setEmailVerified(override === 'true' ? true : (decoded.email_verified ?? true));

      await AsyncStorage.setItem('@auth_session', token);
    } catch (error) {
      console.log('Erro ao fazer login', error);
    }
  }

  async function signOut() {
    setSession(null);
    setRole('aluno');
    setEmail(null);
    setName(null);
    setUserId(null);
    setEmailVerified(true);
    await AsyncStorage.removeItem('@auth_session');
    await AsyncStorage.removeItem('@email_verified_override');
  }

  async function markEmailVerified() {
    setEmailVerified(true);
    await AsyncStorage.setItem('@email_verified_override', 'true');
  }

  return (
    <AuthContext.Provider
      value={{ session, role, email, isLoading, name, userId, emailVerified, signIn, signOut, markEmailVerified }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
