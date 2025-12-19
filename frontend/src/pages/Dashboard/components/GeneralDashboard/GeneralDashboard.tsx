import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  DollarSign,
  Package,
  AlertCircle,
  TrendingDown,
  Users,
  Store,
  Clock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import DateFilter from "../DateFilter";
import DashboardSocket from '../../../../services/dashboardSocket';
import { useAuth } from "../../../../auth/hooks/useAuth";

const GeneralDashboard: React.FC = () => {
  const { user } = useAuth();

  const userId = user?.usuCod;
  const branchId = user?.sucurCod;
  const userName = user?.usuNombreCom || "Usuario";
  const branchName = user?.sucursal?.sucurNom || "Mi Sucursal";
  const userRole = user?.roles?.[0]?.rolNom || "Usuario";
  const darkMode = false;

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [dashboardSocket, setDashboardSocket] = useState<DashboardSocket | null>(null);
  
  // Filtros individuales por sección
  const [salesFilter, setSalesFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [salesChartFilter, setSalesChartFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [earningsFilter, setEarningsFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [expensesFilter, setExpensesFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [clientsFilter, setClientsFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [sellerFilter, setSellerFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');

  // Conectar WebSocket
  useEffect(() => {
    
    if (!userId || !branchId) {
      console.warn("Esperando userId y branchId para conectar WebSocket...");
      return;
    }

    const socket = new DashboardSocket(userId, branchId);
    setDashboardSocket(socket);

    socket.connect(
      (message) => {
        if (message.type === 'dashboard_update') {
          setStats((prevStats: any) => ({
            ...prevStats,
            ...message.data
          }));
          setLoading(false);
        }
        setWsConnected(true);
      },
      () => {
        console.error("error en WebSocket");
        setWsConnected(false);
      },
      5000
    );

    return () => {
      console.log("cerrando WebSocket");
      socket.close();
    };
  }, [userId, branchId]);

  const handleSalesFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setSalesFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ sales_date_range: filter }, 'sales');
    }
  };

  const handleSalesChartFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setSalesChartFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ sales_chart_date_range: filter }, 'daily_sales');
    }
  };

  const handleEarningsFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setEarningsFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ earnings_date_range: filter }, 'earnings');
    }
  };

  const handleExpensesFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setExpensesFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ expenses_date_range: filter }, 'expenses');
    }
  };

  const handleClientsFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setClientsFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ clients_date_range: filter }, 'frequent_clients');
    }
  };

  const handleSellerFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setSellerFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ seller_date_range: filter }, 'sales_by_seller');
    }
  };

  // Datos para el gráfico de ventas
  const salesChartData = stats?.daily_sales?.map((sale: any) => ({
    date: sale.date,
    total: parseFloat(sale.total) || 0
  })) || [];

  if (!user || !userId || !branchId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-2 mb-4`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Bienvenida */}
          <div>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Bienvenido, {userName}
            </h2>
            <p className={`text-sm mt-1 pl-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Panel de {userRole} - {branchName}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Indicador de conexión */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {wsConnected ? 'En tiempo real' : 'Desconectado'}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <Store className="w-5 h-5 text-blue-500" />
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {branchName}
              </span>
            </div>
          </div>

          
        </div>
      </div>

      {/* Stats Cards arriba en una fila */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Ventas con filtro */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border-l-4 border-green-500`}>
          <div className="flex items-center mb-3">
            <ShoppingCart className="w-6 h-6 text-green-500" />
            <h3 className="text-sm font-medium text-gray-600 ml-2">Ventas</h3>
          </div>
          <div className="mb-3">
            <DateFilter 
              title=""
              value={salesFilter} 
              onChange={handleSalesFilterChange}
              darkMode={darkMode}
              compact
            />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.sales?.total || 0}</p>
          <p className="text-xs text-gray-500 mt-1">S/ {(stats?.sales?.revenue || 0).toFixed(2)} en ingresos</p>
        </div>

        {/* Ganancias con filtro */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border-l-4 border-emerald-500`}>
          <div className="flex items-center mb-3">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            <h3 className="text-sm font-medium text-gray-600 ml-2">Ganancias</h3>
          </div>
          <div className="mb-3">
            <DateFilter 
              title=""
              value={earningsFilter} 
              onChange={handleEarningsFilterChange}
              darkMode={darkMode}
              compact
            />
          </div>
          <p className="text-2xl font-bold text-gray-800">S/ {(stats?.earnings?.total || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.earnings?.count || 0} ventas pagadas</p>
        </div>

        {/* Egresos con filtro */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border-l-4 border-orange-500`}>
          <div className="flex items-center mb-3">
            <TrendingDown className="w-6 h-6 text-orange-500" />
            <h3 className="text-sm font-medium text-gray-600 ml-2">Egresos</h3>
          </div>
          <div className="mb-3">
            <DateFilter 
              title=""
              value={expensesFilter} 
              onChange={handleExpensesFilterChange}
              darkMode={darkMode}
              compact
            />
          </div>
          <p className="text-2xl font-bold text-gray-800">S/ {(stats?.expenses?.total || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.expenses?.count || 0} gastos registrados</p>
        </div>
      </div>

      {/* Clientes y Gráfico divididos en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clientes más frecuentes */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 flex flex-col`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Users className="w-5 h-5 text-blue-500" />
            Clientes más frecuentes
          </h3>
          <div className="mb-4">
            <DateFilter 
              title=""
              value={clientsFilter} 
              onChange={handleClientsFilterChange}
              darkMode={darkMode}
              compact
            />
          </div>
          <div className="flex-grow overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700">N° Compras</th>
                </tr>
              </thead>
              <tbody>
                {stats?.frequent_clients?.length > 0 ? (
                  stats.frequent_clients.map((client: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm text-gray-800">{client.nombre}</td>
                      <td className="text-center py-2 px-3 text-sm text-gray-800">{client.compras}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No hay datos de clientes</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico de Ventas Total */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 flex flex-col`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Ventas Total
          </h3>
          <div className="flex gap-2 mb-4">
            <button 
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${salesChartFilter === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleSalesChartFilterChange('today')}
            >
              Día
            </button>
            <button 
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${salesChartFilter === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleSalesChartFilterChange('month')}
            >
              Mes
            </button>
            <button 
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${salesChartFilter === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleSalesChartFilterChange('year')}
            >
              Año
            </button>
          </div>
          <div className="flex-grow">
            {(stats?.sales_chart?.daily_sales || stats?.sales?.daily_sales) && 
              (stats?.sales_chart?.daily_sales || stats?.sales?.daily_sales).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.sales_chart?.daily_sales || stats?.sales?.daily_sales}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis 
                    dataKey="date" 
                    stroke={darkMode ? "#9ca3af" : "#6b7280"}
                    fontSize={10}
                  />
                  <YAxis 
                    stroke={darkMode ? "#9ca3af" : "#6b7280"}
                    fontSize={10}
                  />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>
        
      
      {/* Ventas pendientes */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mt-6`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <AlertCircle className="w-5 h-5 text-cyan-500" />
            Ventas pendientes
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Venta #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado de Venta</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado de recojo</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Precio total</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Restante</th>
                </tr>
              </thead>
              <tbody>
                {stats?.pending_sales?.length > 0 ? (
                  stats.pending_sales.map((sale: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-cyan-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 text-sm">{sale.cliente}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          sale.estado_venta === 'PAGADO' ? 'bg-green-100 text-green-700' :
                          sale.estado_venta === 'PARCIAL' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {sale.estado_venta}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          sale.estado_recojo === 'ENTREGADO' ? 'bg-green-100 text-green-700' :
                          sale.estado_recojo === 'LISTO' ? 'bg-blue-100 text-blue-700' :
                          sale.estado_recojo === 'LABORATORIO' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sale.estado_recojo}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-sm text-gray-900">S/ {sale.precio_total}</td>
                      <td className="text-right py-3 px-4 font-semibold text-sm text-cyan-600">S/ {sale.restante}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <AlertCircle className="w-16 h-16 mb-3 opacity-30" />
                        <p className="text-lg font-medium">No hay ventas pendientes</p>
                        <p className="text-sm mt-1">¡Excelente! Todas las ventas están completadas</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
  );
};

export default GeneralDashboard;
