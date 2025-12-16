import { Navigate } from 'react-router-dom';

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const access = localStorage.getItem('access');
  const refresh = localStorage.getItem('refresh');
  const userStr = localStorage.getItem('user');

  // ✅ Si hay tokens y usuario, asumimos sesión activa
  if (access && refresh && userStr) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}