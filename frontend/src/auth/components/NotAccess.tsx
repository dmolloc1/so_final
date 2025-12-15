import { AlertTriangle } from 'lucide-react';
import type { User } from '../types/user';

interface NotAccessProps {
  user: User;
  allowedLevels?: number[];
}

export default function NotAccess({ user, allowedLevels }: NotAccessProps) {
  const rolesActivos = user.roles.filter(r => r.rolEstado === 'ACTIVO');
  const nivelesUsuario = rolesActivos.map(r => r.rolNivel).join(', ');

  return (
    <div className="max-w-md mx-auto mt-20 p-6 text-center border border-gray-300 rounded-xl shadow-md bg-white">
      <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} strokeWidth={1.5} />
      <h2 className="text-2xl font-semibold mb-2 text-gray-800">Acceso restringido</h2>
      <p className="text-gray-700 mb-4">
        Tu usuario no tiene los permisos necesarios para acceder a esta sección.
      </p>
      <p className="text-sm text-gray-500">
        Roles activos: <span className="font-medium text-gray-700">{nivelesUsuario}</span>
        <br />
        Niveles requeridos: <span className="font-medium text-gray-700">{allowedLevels?.join(', ') || 'Todos'}</span>
      </p>
      <a
        href="/dashboard"
        className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Volver
      </a>
    </div>
  );
}