import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Receipt, Package, FileText, BarChart3, Settings, LogOut, CreditCard, ShoppingBag  } from 'lucide-react';
import logo from "../../assets/registrame.png";
import { getCurrentUser } from "../../auth/services/userService";
import { useEffect, useState } from "react";

import type { User } from "../../auth/types/user";


import cajeroImg from '../../assets/roles/Cajero.png';
import gerenteImg from '../../assets/roles/Gerente.png';
import logisticaImg from '../../assets/roles/Logistica.png';
import optometraImg from '../../assets/roles/Optometra.png';
import vendedorImg from '../../assets/roles/Vendedor.png';

const roleIcons: Record<string, string> = {
  "CAJERO": cajeroImg,
  "GERENTE": gerenteImg,
  "LOGISTICA": logisticaImg,
  "OPTOMETRA": optometraImg,
  "VENDEDOR": vendedorImg,
};

const Sidebar = () => {
    const [currentUser,setCurrentUser] = useState<User|null>(null);
    const roleName = currentUser?.roles?.[0]?.rolNom ?? "Sin rol";
    const roleIcon = roleIcons[roleName] ?? "/assets/icons/default.png";

    const ubicacion = useLocation();

    const links = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/sale-point", label: "Punto de Venta", icon: CreditCard },
        { path: "/sales", label: "Ventas", icon: ShoppingBag  },
        { path: "/inventory", label: "Inventario", icon: Package },
        { path: "/prescriptions", label: "Clientes", icon: FileText },
        { path: "/reports", label: "Reportes", icon: BarChart3 },
        { path: "/settings", label: "Ajustes", icon: Settings },
    ];
    useEffect(() => {
      getCurrentUserSide();  
    }, []);

    const getCurrentUserSide = async() =>{
        try{
            const currentUser = await getCurrentUser();
            setCurrentUser(currentUser);
        }
        catch(error){
            console.log("Error al obtener el usuario actual", error);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/';
    };

    return (
        <aside className="w-64 bg-white flex flex-col h-screen border-r border-gray-300 shadow-sm">
            {/* Logo Section */}
            <div className="pt-8 px-6 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-3 pl-2">
                    <img 
                        src={logo} 
                        className="h-[80px] w-auto object-contain opacity-90" 
                        alt="Registrame"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-4 overflow-y-auto">
                <ul className="space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = ubicacion.pathname.startsWith(link.path);

                        
                        return (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                                        ${isActive
                                            ? 'bg-cyan-100 text-cyan-800 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                        }`}
                                >
                                    {/* Indicador cian lateral */}
                                    {isActive && (
                                        <div className="absolute -left-1 w-1.5 h-10 bg-cyan-500 rounded-full"></div>
                                    )}
                                    
                                    <Icon 
                                        size={20} 
                                        className={`transition-colors duration-200 ${
                                            isActive 
                                                ? 'text-cyan-600' 
                                                : 'text-gray-500 group-hover:text-gray-600'
                                        }`}
                                    />
                                    <span className={`font-medium ${isActive ? 'font-semibold' : 'font-normal'}`}>
                                        {link.label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            {/*Cuenta iniciada section */}
            {currentUser && (
                <div className="p-4 border-t border-gray-200 mt-auto">
                    <div className="flex items-center gap-3">
                    {/* Ícono del rol */}
                    <img
                        src={roleIcons[roleName] ?? vendedorImg}
                        alt={`Rol: ${roleName}`}
                        className="w-10 h-10 rounded-full object-cover"
                    />

                    {/* Nombre y rol */}
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                        {currentUser.usuNom}
                        </span>
                        <span className="text-xs text-gray-500">
                        {roleName}
                        </span>
                    </div>
                    </div>
                </div>
            )}
           {/* Logout Section */}
            <div className="p-4 border-t border-gray-200 mt-auto">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut size={20} className="text-red-600" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;