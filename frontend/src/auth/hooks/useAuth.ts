import { useEffect, useState } from 'react';
import type { User } from '../types/user';
import { getCurrentUser } from '../services/userService';
import api from '../services/api';
//Nuevo cmabio estamos guardando user y sucursla en el locals torage
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userBranch, setUserBranch] = useState<number>(0);

  useEffect(() => {
    const initializeUser = async () => {
      const access = localStorage.getItem('access');
      const refresh = localStorage.getItem('refresh');
// Si no hay access pero sí hay refresh, intenta renovarlo
    if (!access && refresh) {
      try {
        const response = await api.post('/user/token/refresh/', { refresh });
        const newAccess = response.data.access;
        localStorage.setItem('access', newAccess);
        console.log('Token renovado al recargar');
      } catch (err) {
        console.error('Error al renovar token con refresh:', err);
        localStorage.removeItem('refresh');
        return setLoading(false);
      }
    }

    // Ahora intenta cargar el usuario
    const finalAccess = localStorage.getItem('access');
    if (!finalAccess) {
      console.warn('No hay token válido para cargar usuario');
      return setLoading(false);
    }

    try {
      const userData = await getCurrentUser();
      setUser(userData);
      if (typeof userData.sucurCod === 'number') {
        setUserBranch(userData.sucurCod);
      }

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('sucursal', String(userData.sucurCod));
    } catch (error) {
      console.error(' Error al obtener usuario:', error);
      //localStorage.removeItem('access');
      //localStorage.removeItem('refresh');
      //localStorage.removeItem('user');
      //localStorage.removeItem('sucursal');
      //setUser(null);
    } finally {
      setLoading(false);
    }
  };

  initializeUser();
}, []);


  return { user, loading, userBranch };
}