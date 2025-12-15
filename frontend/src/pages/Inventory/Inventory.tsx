import React, { useState, useEffect } from 'react';
import BranchInventory from './components/BranchInventory/BranchInventory';
import CentralInventory from './components/CentralInventory/CentralInventory';
import api from '../../auth/services/api';
import type { User } from '../../auth/types/user';

const Inventory: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<User>('/user/current-user/');
      setCurrentUser(response.data);
      console.log('Usuario actual:', response.data);
    } catch (err: any) {
      console.error('Error al obtener usuario:', err);
      setError('Error al cargar información del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen pt-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error || !currentUser) {
    return (
      <div className="min-h-screen pt-10 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error || 'No se pudo cargar la información del usuario'}</p>
          <button
            onClick={fetchCurrentUser}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Renderizar vista según el rol del usuario
  const renderInventoryView = () => {
    // Obtener roles del usuario
    const userRoles = currentUser.roles.map(role => role.rolNom.toUpperCase());

    console.log('Roles del usuario:', userRoles);

    // Verificar si tiene rol de gerente
    const isManager = userRoles.some(role => role === 'GERENTE');

    // Verificar si tiene rol de supervisor/logística/vendedor
    const isBranchUser = userRoles.some(role => 
      role === 'SUPERVISOR' || role === 'LOGISTICA' || role === 'VENDEDOR'
    );

    if (isManager) {
      // Vista central para gerentes (acceso a todos los productos)
      return <CentralInventory user={currentUser} />;
    }

    if (isBranchUser) {
      // Vista de sucursal para supervisores y logística
      if (!currentUser.sucursal && !currentUser.sucurCod) {
        return (
          <div className="min-h-screen pt-10 flex items-center justify-center">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg max-w-md text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-lg font-semibold mb-2">Sin Sucursal Asignada</h2>
              <p>Tu usuario no tiene una sucursal asignada. Por favor, contacta al administrador.</p>
            </div>
          </div>
        );
      }
      return <BranchInventory user={currentUser} />;
    }

    // Si no tiene ningún rol reconocido
    return (
      <div className="min-h-screen pt-10 flex items-center justify-center">
        <div className="bg-gray-50 border border-gray-200 text-gray-800 p-6 rounded-lg max-w-md text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <h2 className="text-lg font-semibold mb-2">Acceso No Autorizado</h2>
          <p>Tu usuario no tiene permisos para acceder al inventario.</p>
          <p className="text-sm text-gray-600 mt-2">
            Roles detectados: {userRoles.length > 0 ? userRoles.join(', ') : 'Ninguno'}
          </p>
        </div>
      </div>
    );
  };

  return renderInventoryView();
};

export default Inventory;