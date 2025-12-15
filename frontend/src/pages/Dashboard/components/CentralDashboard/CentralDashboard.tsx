import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Package, 
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  AlertTriangle,
  Store,
  PieChart ,
  AlertOctagon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from  "../StatsCard";
import DashboardSocket from '../../../../services/dashboardSocket';
import api from '../../../../auth/services/api';
import { useAuth } from "../../../../auth/hooks/useAuth";

interface Branch {
  sucurCod: number;
  sucurNom: string;
  sucurDirec: string;
  sucurTele: string;
  total_items?: number;
  low_stock?: number;
}

const CentralDashboard: React.FC =()=> {
  const { user } = useAuth();

  const userId = user?.usuCod!;
  const userName = user?.usuNombreCom || "Gerente";
  const darkMode = false;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>('all');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [dashboardSocket] = useState(() => new DashboardSocket(userId, 'all'));

  // Cargar sucursales
  useEffect(() => {
    loadBranches();
  }, []);

  // Conectar WebSocket
  useEffect(() => {
    dashboardSocket.connect(
      (message) => {
        if (message.type === 'dashboard_update') {
          setStats(message.data);
          setLoading(false);
        }
        setWsConnected(true);
      },
      () => {
        setWsConnected(false);
      },
      3000 // Intervalo de refresco cada 3 segundos
    );

    return () => {
      dashboardSocket.close();
    };
  }, [dashboardSocket]);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branch/');
      setBranches(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleBranchChange = (branchId: number | 'all') => {
    setSelectedBranchId(branchId);
    setLoading(true);
    
    // Crear nueva conexión WebSocket con la sucursal seleccionada
    const newSocket = new DashboardSocket(userId, branchId);
    newSocket.connect(
      (message) => {
        if (message.type === 'dashboard_update') {
          setStats(message.data);
          setLoading(false);
        }
      }
    );
  };

  // Datos para gráfico de sucursales
  const branchChartData = stats?.branches?.map((branch: any) => ({
    name: branch.sucurNom,
    productos: branch.total_items || 0,
    stockBajo: branch.low_stock || 0,
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'}  p-2 mb-4`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Bienvenida */}
          <div>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Bienvenido, {userName}
            </h2>
            <p className={`text-sm mt-1 pl-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Panel de Control Gerencial
            </p>
          </div>

          {/* Selector de Sucursal */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {wsConnected ? 'En tiempo real' : 'Desconectado'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Vista:
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className={`border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">Vista Global (Todas las sucursales)</option>
                <optgroup label="Sucursales">
                  {branches.map((branch) => (
                    <option key={branch.sucurCod} value={branch.sucurCod}>
                      {branch.sucurNom}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ml-0 md:ml-4">
        <StatsCard
          title="Total Productos"
          value={stats?.inventory?.total_products || 0}
          subtitle={`${stats?.inventory?.global_products || 0} globales, ${stats?.inventory?.local_products || 0} locales`}
          icon={<Package className="w-6 h-6 text-blue-500" />}
          borderColor="border-blue-500"
          loading={loading}
        />

        <StatsCard
          title="Stock Bajo"
          value={stats?.inventory?.low_stock || 0}
          subtitle="Requieren reabastecimiento"
          icon={<AlertCircle className="w-6 h-6 text-orange-500"  />}
          borderColor="border-orange-500"
          loading={loading}
        />

        <StatsCard
          title="Valor Inventario"
          value={`S/ ${(stats?.inventory?.total_value || 0).toFixed(2)}`}
          subtitle="Costo total del inventario"
          icon={<DollarSign className="w-6 h-6 text-green-500" />}
          borderColor="border-green-500"
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

      {/* Alertas */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 mt-4`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {stats.alerts.map((alert: any, index: number) => {
              const Icon = alert.type === "error" ? AlertTriangle : AlertOctagon;

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border shadow-sm ${
                    alert.type === "error"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  }`}
                >
                  <Icon className="w-6 h-6 text-red-600 dark:text-red-300" />

                  <div className="flex-1">
                    <h4
                      className={`font-semibold ${
                        alert.type === "error"
                          ? "text-red-500"
                          : "text-yellow-200"
                      }`}
                    >
                      {alert.title}
                    </h4>

                    <p
                      className={`text-sm mt-1 ${
                        alert.type === "error"
                          ? "text-red-400"
                          : "text-yellow-300"
                      }`}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ml-0 md:ml-4">
        {/* Gráfico de Sucursales */}
        {selectedBranchId === 'all' && branchChartData.length > 0 && (
          <div
            className={`
              ${darkMode ? 'bg-gray-800' : 'bg-white'}
              p-6 rounded-xl shadow-lg border
              ${darkMode ? 'border-gray-700' : 'border-gray-200'}
            `}
          >
            <h3
              className={`text-lg font-semibold mb-6 flex items-center gap-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Store className="w-5 h-5" />
              Inventario actual por Sucursal
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#e5e7eb"}
                />
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
                <Bar dataKey="productos" fill="#3b82f6" name="Total Productos" />
                <Bar dataKey="stockBajo" fill="#f59e0b" name="Stock Bajo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Distribución de Productos -falta corregir*/}
        <div
          className={`
            ${darkMode ? 'bg-gray-800' : 'bg-white'}
            p-6 rounded-xl shadow-lg border
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          `}
        >
          <h3
            className={`text-lg font-semibold mb-6 flex items-center gap-2 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            <PieChart className="w-5 h-5" />
            Distribución de Productos
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Productos Globales
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {stats?.inventory?.global_products || 0}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-purple-50"}`}>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Productos Locales
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              >
                {stats?.inventory?.local_products || 0}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-orange-50"}`}>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Stock Bajo
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  darkMode ? "text-orange-400" : "text-orange-600"
                }`}
              >
                {stats?.inventory?.low_stock || 0}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-red-50"}`}>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Sin Stock
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  darkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                {stats?.inventory?.out_of_stock || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Sucursales (solo en vista global) */}
      {selectedBranchId === 'all' && stats?.branches && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden md:ml-4 shadow-sm mt-6`}>
          <div className="p-6 border-b border-gray-200 ">
            <h3
              className={`text-lg font-semibold flex items-center gap-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Building2 className="w-5 h-5 text-blue-500" />
              Estado de Sucursales
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.branches.map((branch: any) => (
                <div
                  key={branch.sucurCod}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    darkMode 
                      ? 'border-gray-700 hover:border-blue-500 bg-gray-700' 
                      : 'border-gray-200 hover:border-blue-500 bg-gray-50'
                  }`}
                  onClick={() => handleBranchChange(branch.sucurCod)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {branch.sucurNom}
                      </h4>
                    </div>
                    <ArrowUpRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>

                  <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    📍 {branch.sucurDirec}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Items:
                      </span>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {branch.total_items || 0}
                      </span>
                    </div>

                    {branch.low_stock > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-600 dark:text-orange-400">
                          Stock Bajo:
                        </span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {branch.low_stock}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentralDashboard;