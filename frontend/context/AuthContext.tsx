import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import api from '../lib/api';

type User = { _id: string; name: string; email: string; role: 'admin' | 'student' } | null;

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
      setUser(null);
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
