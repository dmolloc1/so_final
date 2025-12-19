import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Package, 
  DollarSign,
  AlertCircle,
  Store,
  Users,
  ShoppingCart,
  TrendingDown
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
import StatsCard from  "../StatsCard";
import DateFilter from "../DateFilter";
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

const CentralDashboard: React.FC = () => {
  const { user } = useAuth();

  const userId = user?.usuCod;
  const userName = user?.usuNombreCom || "Gerente";
  const darkMode = false;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>('all');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [dashboardSocket, setDashboardSocket] = useState<DashboardSocket | null>(null);
  
  // filtros por seccion - CADA UNO INDEPENDIENTE
  const [salesFilter, setSalesFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [salesChartFilter, setSalesChartFilter] = useState<'today' | 'week' | 'month' | 'year'>('month'); // Separado del StatCard
  const [earningsFilter, setEarningsFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [expensesFilter, setExpensesFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [clientsFilter, setClientsFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [sellerFilter, setSellerFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [reportsFilter, setReportsFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');

  // Cargar sucursales
  useEffect(() => {
    loadBranches();
  }, []);

  // Conectar WebSocket
  useEffect(() => {
    
    if (!userId) {
      console.warn("Esperando userId para conectar WebSocket...");
      return;
    }

    //console.log("se inicia WebSocket con", { userId, selectedBranchId });

    const socket = new DashboardSocket(userId, selectedBranchId);
    setDashboardSocket(socket);

    socket.connect(
      (message) => {
        //console.log("mensaje recibido:", message);
        if (message.type === 'dashboard_update') {
          // MERGE de datos en lugar de reemplazo completo
          // Solo actualiza las secciones que vienen en el mensaje
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
      5000 // Intervalo de refresco cada 5 segundos
    );

    return () => {
      console.log("cerrando WebSocket");
      socket.close();
    };
  }, [userId, selectedBranchId]); // Agregado userId a dependencias

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
    
    // Enviar filtro de sucursal al backend
    if (dashboardSocket) {
      const branchFilter = branchId === 'all' ? null : branchId;
      dashboardSocket.updateFilters({ branch_id: branchFilter }, 'all');
    }
  };

  const handleSalesFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setSalesFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ sales_date_range: filter }, 'sales');
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

  const handleReportsFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setReportsFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ reports_date_range: filter }, 'branch_reports');
    }
  };

  // Handler separado para el gráfico de ventas
  const handleSalesChartFilterChange = (filter: 'today' | 'week' | 'month' | 'year') => {
    setSalesChartFilter(filter);
    if (dashboardSocket) {
      dashboardSocket.updateFilters({ sales_chart_date_range: filter }, 'sales_chart');
    }
  };

  // Datos para gráfico de sucursales
  const branchChartData = stats?.branches?.map((branch: any) => ({
    name: branch.sucurNom,
    productos: branch.total_items || 0,
    stockBajo: branch.low_stock || 0,
  })) || [];

  // Pantalla de carga mientras se obtiene userId
  if (!user || !userId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard gerencial...</p>
          {import.meta.env.DEV && (
            <div className="mt-4 text-xs text-gray-500">
              <p>User: {user ? '✓' : '✗'}</p>
              <p>UserId: {userId || 'undefined'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

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

      {/* Stats Cards arriba en una fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Ventas con filtro */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border-l-4 border-green-500`}>
          <div className="flex items-center  mb-3">
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

        {/* Productos Activos */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border-l-4 border-blue-500`}>
          <div className="flex items-center  mb-3">
            <Package className="w-6 h-6 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-600 ml-2">Productos Activos</h3>
            
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.inventory?.total_products || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.inventory?.global_products || 0} globales</p>
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
                {stats?.frequent_clients?.map((client: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 text-gray-900 text-sm">{client.nombre}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                        {client.compras}
                      </span>
                    </td>
                  </tr>
                ))}
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

      {/* Dos columnas */ }
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Ventas por vendedor */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mt-6`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Users className="w-5 h-5 text-cyan-500" />
            Ventas por Vendedor
          </h3>

          <div className="mb-4">
            <DateFilter 
              title=""
              value={sellerFilter} 
              onChange={handleSellerFilterChange}
              darkMode={darkMode}
            />
          </div>

          <div className="space-y-6">
            {stats?.sales_by_seller && stats.sales_by_seller.length > 0 ? (
              stats.sales_by_seller.map((seller: any, sellerIdx: number) => (
                <div key={sellerIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                  
                  {/* Header del Vendedor */}
                  <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-white" />
                        <div>
                          <p className="text-white font-bold text-lg">
                            {seller.vendedor || seller.vendedor_nombre}
                          </p>
                          {seller.sucursal && (
                            <p className="text-cyan-100 text-sm flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              {seller.sucursal}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-white text-2xl font-bold">
                          S/ {(seller.total_monto || 0).toFixed(2)}
                        </p>
                        <p className="text-cyan-100 text-sm">
                          {seller.total_ventas || 0} {seller.total_ventas === 1 ? 'venta' : 'ventas'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de ventas del vendedor */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Fecha y Hora
                          </th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Caja
                          </th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        {seller.ventas && seller.ventas.length > 0 ? (
                          seller.ventas.map((venta: any, ventaIdx: number) => (
                            <tr
                              key={ventaIdx}
                              className={`
                                border-b border-gray-100
                                hover:bg-cyan-50
                                ${darkMode ? 'hover:bg-cyan-900/20 border-gray-700' : ''}
                                transition-colors
                              `}
                            >
                              <td className={`py-3 px-4 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                #{venta.ventCod || venta.id}
                              </td>
                              <td className={`py-3 px-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {venta.ventFecha || venta.fecha || 'N/A'}
                              </td>
                              <td className={`py-3 px-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {venta.caja || venta.cajNom || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-semibold text-cyan-600">
                                S/ {(venta.ventTotal || venta.total || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-sm text-gray-500 italic">
                              Sin detalle de ventas disponible
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Users className="w-16 h-16 mb-3 opacity-30" />
                  <p className="text-lg font-medium">No hay ventas por vendedor</p>
                  <p className="text-sm mt-1">
                    Los datos aparecerán cuando haya ventas registradas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Ventas pendientes */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mt-6`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <AlertCircle className="w-5 h-5 text-cyan-500" />
            Ventas pendientes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado de Venta</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado de recojo</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Precio total</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Restante</th>
                </tr>
              </thead>
              <tbody>
                {stats?.pending_sales && stats.pending_sales.length > 0 ? (
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
                      <td className="text-right py-3 px-4 font-semibold text-sm  text-cyan-600">S/ {sale.restante}</td>
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


      {/* Reportes por Sucursal */}
      {stats?.branch_reports && stats.branch_reports.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mt-6`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Building2 className="w-5 h-5 text-cyan-500" />
            Resumen por Sucursal
          </h3>
          <div className="mb-4">
            <DateFilter 
              title=""
              value={reportsFilter} 
              onChange={handleReportsFilterChange}
              darkMode={darkMode}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.branch_reports.map((report: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-lg text-gray-900 mb-3">{report.sucursal}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ventas:</span>
                    <span className="font-semibold text-green-600">{report.total_ventas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ingresos:</span>
                    <span className="font-semibold text-blue-600">S/ {report.total_ingresos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Productos:</span>
                    <span className="font-semibold text-purple-600">{report.total_productos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock Bajo:</span>
                    <span className="font-semibold text-red-600">{report.low_stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CentralDashboard;