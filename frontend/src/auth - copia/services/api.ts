import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';

if (ENVIRONMENT === 'development') {
  console.log('Configuración API:', {
    baseURL: API_BASE_URL,
    environment: ENVIRONMENT,
  });
}

// Función auxiliar para verificar si la sesión está lista
const isSessionReady = () => {
  const token = localStorage.getItem('access');
  const user = localStorage.getItem('user');
  return !!token && !!user;
};

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor único para requests: token + sucursal
api.interceptors.request.use(
  (config) => {
    try {
      if (!isSessionReady()) {
        console.warn('Sesión no lista: se omite token y sucursal');
        return config;
      }

      // Token de acceso
      const token = localStorage.getItem('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token agregado:', token);
      }

      // Sucursal lógica
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);

        // Extraer sucursal desde cualquier forma disponible en el usuario
        const branchCode =
          user.sucurCod ??
          user.sucursal?.sucurCod ??
          (Number(localStorage.getItem('sucursal')) || undefined);

        //OJO LISTA PARA ENDPOINTS QUE REQUIEREN SUCURSAL menos inventario que es independiente
        const endpointsWithBranchParam = ['/user/', '/user/list/', '/cash/', '/cash/opening', '/clients/', '/client/list/', '/recetas/', '/recetas/list/', '/recipes/', '/recipes/list/'];
        //OJO


        const needsBranchParam = endpointsWithBranchParam.some(endpoint =>
          config.url?.includes(endpoint)
        );

        if (config.method === 'get' && branchCode && needsBranchParam) {
          config.params = {
            ...config.params,
            branch: branchCode,
          };
        }

        if (['post', 'put', 'patch'].includes(config.method || '') && branchCode) {
          if (config.data && typeof config.data === 'object' && !config.data.sucurCod) {
            config.data = {
              ...config.data,
              sucurCod: branchCode,
            };
          }
        }
      }
    } catch (error) {
      console.warn('Error en interceptor de request:', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: refresco de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) throw new Error('No hay refresh token');

        console.log('Intentando refrescar token...');

        const response = await axios.post(`${API_BASE_URL}/user/token/refresh/`, {
          refresh,
        });

        const { access } = response.data;
        localStorage.setItem('access', access);
        console.log('Token refrescado exitosamente');

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        //console.error('Error al refrescar token:', refreshError);
        //localStorage.removeItem('access');
        //localStorage.removeItem('refresh');
        //return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;