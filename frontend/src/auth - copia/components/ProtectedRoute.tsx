import { Navigate } from 'react-router-dom';
import type { User } from '../types/user';
import NotAccess from './NotAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
  allowedLevels?: number[];
}

export default function ProtectedRoute({ children, user, allowedLevels }: ProtectedRouteProps) {
  if (!user) return <Navigate to="/" replace />;

  const rolesActivos = user.roles.filter(r => r.rolEstado === 'ACTIVO');
  const nivelesUsuario = rolesActivos.map(r => r.rolNivel);
  const tieneAcceso = allowedLevels
    ? nivelesUsuario.some(n => allowedLevels.includes(n))
    : true;

  if (!tieneAcceso) {
    return <NotAccess user={user} allowedLevels={allowedLevels} />;
  }

  return <>{children}</>;
}