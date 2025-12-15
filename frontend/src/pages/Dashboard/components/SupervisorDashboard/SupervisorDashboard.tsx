"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle, Boxes,TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import StatsCard from "../StatsCard";
import DashboardSocket from "../../../../services/dashboardSocket";
import { useAuth } from "../../../../auth/hooks/useAuth";

const SupervisorDashboard: React.FC = () => {
    const { user } = useAuth();
    const userName = user?.usuNombreCom || "Supervisor";
    
    //Obtener branchId y userId desde el usuario autenticado
    const branchId = user?.sucurCod;
    const userId = user?.usuCod;
    const branchName = user?.sucursal?.sucurNom || `Sucursal ${branchId}`;
    const darkMode = false;

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const [dashboardSocket, setDashboardSocket] = useState<DashboardSocket | null>(null);

    // Conectar WebSocket cuando tengamos userId y branchId
    useEffect(() => {
        if (!branchId || !userId) {
            console.log("Esperando datos del usuario...", { branchId, userId });
            return;
        }

        console.log(`Conectando WebSocket para sucursal ${branchId}, usuario ${userId}`);
        
        // Crear socket con el branchId específico
        const socket = new DashboardSocket(userId, branchId);
        setDashboardSocket(socket);

        // Conectar WebSocket
        socket.connect(
            (message) => {
                
                //console.log("Mensaje recibido:", message);
                
                // Mismo formato que CentralDashboard
                if (message.type === 'dashboard_update') {
                    //console.log("Dashboard actualizado:", message.data);
                    setStats(message.data);
                    setLoading(false);
                }
                setWsConnected(true);
            },
            () => {
                console.error("WebSocket Error:");
                setWsConnected(false);
            },
            3000 // Intervalo de refresco cada 3 segundos
        );

        return () => {
            console.log("Cerrando WebSocket");
            socket.close();
        };
    }, [branchId, userId]);

    // Preparar datos para el gráfico
    const chartData = stats?.chart_data || [];

    // Estado de carga inicial
    if (!user || !branchId || !userId) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del supervisor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-2 mb-4`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Bienvenido, {userName}
                        </h2>
                        <p className={`text-sm mt-1 pl-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {branchName}
                        </p>
                    </div>

                    {/* Estado de conexión */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {wsConnected ? 'En tiempo real' : 'Desconectado'}
                        </span>
                    </div>
                </div>
            </div>

            {/* TARJETAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 ml-0 md:ml-4">
                <StatsCard
                    title="Total Productos"
                    value={stats?.inventory?.total_products || 0}
                    subtitle={`${stats?.inventory?.global_products || 0} globales, ${stats?.inventory?.local_products || 0} locales`}
                    icon={<Boxes className="w-6 h-6 text-blue-500" />}
                    borderColor="border-blue-500"
                    loading={loading}
                />

                <StatsCard
                    title="Stock Bajo"
                    value={stats?.inventory?.low_stock || 0}
                    subtitle="Requieren reabastecimiento"
                    icon={<AlertTriangle className="w-6 h-6 text-orange-500" />}
                    borderColor="border-orange-500"
                    loading={loading}
                />

                <StatsCard
                    title="Sin Stock"
                    value={stats?.inventory?.out_of_stock || 0}
                    subtitle="Sin unidades disponibles"
                    icon={<Package className="w-6 h-6 text-red-500" />}
                    borderColor="border-red-500"
                    loading={loading}
                />

                <StatsCard
                    title="Egresos Hoy"
                    value={`S/ ${(stats?.expenses?.new_products_cost || 0).toFixed(2)}`}
                    subtitle="Productos agregados hoy"
                    icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
                    borderColor="border-purple-500"
                    loading={loading}
                />
            </div>

            {/* GRÁFICO -esta para corregir*/}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} mt-6 ml-0 md:ml-4`}>
                <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Estado de Stock Crítico
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                            data={[
                                {
                                    name: 'Estado del Inventario',
                                    'Stock Bajo': stats?.inventory?.low_stock || 0,
                                    'Sin Stock': stats?.inventory?.out_of_stock || 0,
                                    'Stock Normal': (stats?.inventory?.total_products || 0) - 
                                                (stats?.inventory?.low_stock || 0) - 
                                                (stats?.inventory?.out_of_stock || 0)
                                }
                            ]}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                            <XAxis 
                                dataKey="name" 
                                stroke={darkMode ? "#9ca3af" : "#6b7280"} 
                                fontSize={12} 
                            />
                            <YAxis 
                                stroke={darkMode ? "#9ca3af" : "#6b7280"} 
                                fontSize={12} 
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                                    border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                                    borderRadius: "8px",
                                }}
                            />
                            <Bar dataKey="Stock Normal" fill="#10b981" name="Stock Normal" />
                            <Bar dataKey="Stock Bajo" fill="#f59e0b" name="Stock Bajo" />
                            <Bar dataKey="Sin Stock" fill="#ef4444" name="Sin Stock" />
                        </BarChart>
                    </ResponsiveContainer>
                )}

                {/* Leyenda personalizada */}
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Stock Normal: {(stats?.inventory?.total_products || 0) - 
                                        (stats?.inventory?.low_stock || 0) - 
                                        (stats?.inventory?.out_of_stock || 0)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-orange-500"></div>
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Stock Bajo: {stats?.inventory?.low_stock || 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Sin Stock: {stats?.inventory?.out_of_stock || 0}
                        </span>
                    </div>
                </div>
            </div>

            
        </div>
    );
}

export default SupervisorDashboard;