import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirección automática según el nivel del usuario
  React.useEffect(() => {
    if (user && user.roles && user.roles.length > 0) {
      const currentPath = window.location.pathname;
      
      // Si está en /dashboard (sin subruta), redirigir según nivel del primer rol
      if (currentPath === '/dashboard') {
        // Obtener el rol con el nivel más bajo (más privilegios)
        const highestRole = user.roles.reduce((prev, current) => 
          prev.rolNivel < current.rolNivel ? prev : current
        );
        
        switch (highestRole.rolNivel) {
          case 0: // GERENTE Central
            navigate('/dashboard/central', { replace: true });
            break;
          case 1: // SUPERVISOR
            navigate('/dashboard/supervisor', { replace: true });
            break;
          default: // Otros roles (CAJERO, VENDEDOR, OPTOMETRA, LOGISTICA)
            // Ya está en GeneralDashboard
            break;
        }
      }
    }
  }, [user, navigate]);

  return (
    <div className="w-full h-full">
      {/* Aquí se renderizan las subrutas */}
      <Outlet />
    </div>
  );
};

export default Dashboard;