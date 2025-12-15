import React, { createContext, useEffect, useState, useContext } from 'react';
import api from '../auth/services/api';
import { getCurrentUser as apiGetUser } from '../auth/services/userService';

type AuthContextType = {
  user: any | null;
  initialized: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({ user: null, initialized: false, logout: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const access = localStorage.getItem('access') || localStorage.getItem('access_token');
      if (access) {
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        try {
          const u = await apiGetUser();
          if (!mounted) return;
          setUser(u);
        } catch (e) {
          // intenta refresh si falla (interceptor de api ya lo hace), si sigue fallando, limpia
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          setUser(null);
        }
      }
      if (mounted) setInitialized(true);
    })();
    return () => { mounted = false; };
  }, []);

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, initialized, logout }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);