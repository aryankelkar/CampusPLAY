import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import api from '../lib/api';

type User = {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  phone?: string;
  alternatePhone?: string;
  roll?: string;
  branch?: string;
  division?: string;
  classYear?: string;
  semester?: number;
  academicProfileVerified?: boolean;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refresh: async () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data?.data?.user || null);
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('campusplay_token');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      // Ignore logout errors, clear state anyway
      if (process.env.NODE_ENV !== 'production') {
        console.error('Logout error:', err);
      }
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('campusplay_token');
      }
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    refresh(); 
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
