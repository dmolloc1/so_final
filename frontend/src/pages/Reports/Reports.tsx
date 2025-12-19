import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

export default function Reports() {
    const location = useLocation();
    const { user } = useAuth();

    const isManager = user?.roles.some(role => role.rolNivel === 0);

    const tabs = [
        ...(isManager ? [
            { path: '/reports/central', label: 'Reportes Generales', icon: BarChart3 }
        ] : []),
        { path: '/reports/supervisor', label: 'Reportes Supervisor', icon: TrendingUp },
        { path: '/reports/cash', label: 'Reportes por Caja', icon: Wallet }
    ];

    return (
        <div className="p-6">
            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = location.pathname === tab.path;

                        return (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                className={`
                                    group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                                    transition-colors duration-200
                                    ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon
                                    className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`}
                                />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <Outlet />
        </div>
    );
}
