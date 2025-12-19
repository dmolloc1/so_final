import { useState, useEffect } from 'react';
import { reportsService } from '../../../../services/reportsService';
import type { SalesReportData, FinancialReportData, BranchComparisonData, ClientsReportData, PendingSalesData } from '../../../../services/reportsService';
import { branchService } from '../../../../services/branchService';
import type { Branch } from '../../../../types/branch';
import { getSellers } from '../../../../auth/services/userService';
import {
  BarChart3,
  Filter,
  Download,
  Building2,
  Users,
  Clock,
  List,
  Printer,
  UserCheck
} from 'lucide-react';


export default function CentralReports() {
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<number | undefined>(undefined);
    const [branches, setBranches] = useState<Branch[]>([]);

    const [salesReport, setSalesReport] = useState<SalesReportData | null>(null);
    const [financialReport, setFinancialReport] = useState<FinancialReportData | null>(null);
    const [branchComparison, setBranchComparison] = useState<BranchComparisonData | null>(null);
    const [clientsReport, setClientsReport] = useState<ClientsReportData | null>(null);
    const [pendingSales, setPendingSales] = useState<PendingSalesData | null>(null);
    
    const [salesList, setSalesList] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Estado para historial de ventas por vendedor
    const [sellerSalesHistory, setSellerSalesHistory] = useState<any>(null);
    const [sellerHistoryPage, setSellerHistoryPage] = useState(1);
    const [sellers, setSellers] = useState<any[]>([]);
    const [selectedSeller, setSelectedSeller] = useState<number | undefined>(undefined);
    const [selectedSaleType, setSelectedSaleType] = useState<string>('');

    useEffect(() => {
        loadBranches();
        loadSellers();
        
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            loadAllReports();
            loadSalesList(1);
            loadSellerSalesHistory(1);
        }
    }, [startDate, endDate, selectedBranch, selectedSeller, selectedSaleType]);

    const loadBranches = async () => {
        try {
            const data = await branchService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error('Error loading branches:', error);
        }
    };

    const loadSellers = async () => {
        try {
            const data = await getSellers();
            setSellers(data);
        } catch (error) {
            console.error('Error loading sellers:', error);
        }
    };

    const loadAllReports = async () => {
        setLoading(true);
        try {
            const filters = {
                start_date: startDate,
                end_date: endDate,
                branch_id: selectedBranch
            };

            const [sales, financial, clients, pending, comparison] = await Promise.all([
                reportsService.getSalesReport(filters),
                reportsService.getFinancialReport(filters),
                reportsService.getClientsReport(filters),
                reportsService.getPendingSales(filters),
                reportsService.getBranchComparison(filters)
            ]);

            setSalesReport(sales);
            setFinancialReport(financial);
            setClientsReport(clients);
            setPendingSales(pending);
            setBranchComparison(comparison);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSalesList = async (page: number) => {
        try {
            const data = await reportsService.getSalesList({
                start_date: startDate,
                end_date: endDate,
                branch_id: selectedBranch,
                page,
                page_size: 20
            });
            setSalesList(data);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading sales list:', error);
        }
    };

    const loadSellerSalesHistory = async (page: number) => {
        try {
            const data = await reportsService.getSellerSalesHistory({
                start_date: startDate,
                end_date: endDate,
                branch_id: selectedBranch,
                seller_id: selectedSeller,
                sale_type: selectedSaleType || undefined,
                page,
                page_size: 20
            });
            setSellerSalesHistory(data);
            setSellerHistoryPage(page);
        } catch (error) {
            console.error('Error loading seller sales history:', error);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
    };

    const handleExportSales = () => {
        reportsService.exportSalesCSV({ start_date: startDate, end_date: endDate, branch_id: selectedBranch });
    };

    const handleExportClientsDebt = () => {
        reportsService.exportClientsDebtCSV({ start_date: startDate, end_date: endDate, branch_id: selectedBranch });
    };

    const handleExportBranchComparison = () => {
        reportsService.exportBranchComparisonCSV({ start_date: startDate, end_date: endDate });
    };

    const handleExportSellerSalesHistory = () => {
        reportsService.exportSellerSalesHistoryCSV({ 
            start_date: startDate, 
            end_date: endDate, 
            branch_id: selectedBranch,
            seller_id: selectedSeller,
            sale_type: selectedSaleType || undefined
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Reportes Gerenciales</h1>
                    </div>

                    <p className="text-gray-600 mt-1">
                        {selectedBranch 
                            ? `Vista de: ${branches.find(b => b.sucurCod === selectedBranch)?.sucurNom || 'Cargando...'}`
                            : 'Vista global de todas las sucursales'
                        }
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-lg">Filtros</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sucursal (Opcional)
                        </label>
                        <select
                            value={selectedBranch || ''}
                            onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todas las sucursales</option>
                            {branches.map(branch => (
                                <option key={branch.sucurCod} value={branch.sucurCod}>
                                    {branch.sucurNom}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={loadAllReports}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Cargando reportes...</p>
                </div>
            ) : (
                <>
                    {/* Tarjetas de Resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-sm font-medium text-gray-600">Ventas Totales</h4>
                            <p className="text-2xl font-bold text-blue-600 mt-2">
                                {formatCurrency(salesReport?.total_sales || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {salesReport?.sales_count || 0} ventas
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-sm font-medium text-gray-600">Utilidad Bruta</h4>
                            <p className="text-2xl font-bold text-green-600 mt-2">
                                {formatCurrency(financialReport?.utilidad_bruta || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Margen: {financialReport?.margen_porcentaje.toFixed(1) || 0}%
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-sm font-medium text-gray-600">Por Cobrar</h4>
                            <p className="text-2xl font-bold text-orange-600 mt-2">
                                {formatCurrency(financialReport?.ingresos_por_cobrar || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {clientsReport?.debt_count || 0} clientes
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-sm font-medium text-gray-600">Ventas Pendientes</h4>
                            <p className="text-2xl font-bold text-red-600 mt-2">
                                {pendingSales?.summary.count || 0}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {formatCurrency(pendingSales?.summary.total_pendiente || 0)}
                            </p>
                        </div>
                    </div>

                    {/* Comparativa de Sucursales */}
                     {/* Tabla de comparación de sucursales */}
                     {branchComparison && branchComparison.branches && branchComparison.branches.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Ventas</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Promedio</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Por Cobrar</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inventario</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {branchComparison.branches.map((branch) => (
                                            <tr key={branch.branch_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">{branch.branch_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(branch.total_ventas)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">{branch.cantidad_ventas}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(branch.promedio_venta)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-orange-600">{formatCurrency(branch.total_por_cobrar)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600">{formatCurrency(branch.valor_inventario)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Clientes con Deuda */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-semibold">Clientes Clave y Deudas</h3>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportClientsDebt}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    CSV
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                                >
                                    <Printer className="w-4 h-4" />
                                    PDF
                                </button>
                            </div>

                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-xs text-gray-600">0-30 días</p>
                                <p className="text-lg font-bold">{formatCurrency(clientsReport?.debt_aging.current || 0)}</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded">
                                <p className="text-xs text-gray-600">30-60 días</p>
                                <p className="text-lg font-bold text-yellow-700">{formatCurrency(clientsReport?.debt_aging['30_60'] || 0)}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded">
                                <p className="text-xs text-gray-600">60-90 días</p>
                                <p className="text-lg font-bold text-orange-700">{formatCurrency(clientsReport?.debt_aging['60_90'] || 0)}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded">
                                <p className="text-xs text-gray-600">+90 días</p>
                                <p className="text-lg font-bold text-red-700">{formatCurrency(clientsReport?.debt_aging.over_90 || 0)}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Compras</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">N° Compras</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deuda</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {clientsReport?.top_clients.slice(0, 10).map((client, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{client.cliNombreCom}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{client.cliDocNum}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(client.total_compras)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">{client.cantidad_compras}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 font-semibold">
                                                {formatCurrency(client.total_deuda)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Ventas Pendientes */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-semibold">Ventas Pendientes</h3>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportSales}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    CSV
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                                >
                                    <Printer className="w-4 h-4" />
                                    PDF
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Adelanto</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingSales?.pending_sales.slice(0, 20).map((sale) => (
                                        <tr key={sale.ventCod} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{sale.ventCod}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{sale.cliNombreCom}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.ventFecha).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{sale.sucurCod__sucurNom}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(sale.ventTotal)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(sale.ventAdelanto)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 font-semibold">
                                                {formatCurrency(sale.ventSaldo)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    sale.ventEstadoRecoj === 'ENTREGADO' ? 'bg-green-100 text-green-800' :
                                                    sale.ventEstadoRecoj === 'LISTO' ? 'bg-blue-100 text-blue-800' :
                                                    sale.ventEstadoRecoj === 'LABORATORIO' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {sale.ventEstadoRecoj}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tabla de Todas las Ventas */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <List className="w-5 h-5 text-gray-700" />
                                <h2 className="text-xl font-semibold text-gray-900">Listado de Ventas</h2>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportSales}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                    <Download className="w-4 h-4" />
                                    CSV
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    <Printer className="w-4 h-4" />
                                    PDF
                                </button>
                            </div>
                        </div>
                        
                        {salesList && (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adelanto</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma Pago</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {salesList.sales.map((sale: any) => (
                                                <tr key={sale.ventCod} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.ventCod}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {new Date(sale.ventFecha).toLocaleDateString('es-PE')}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{sale.cliNombreCom}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.cliDocNum}</td>
                                                    <td className="px-6 py-4 text-sm">{sale.sucurCod__sucurNom}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {formatCurrency(sale.ventTotal)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {formatCurrency(sale.ventAdelanto)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {formatCurrency(sale.ventSaldo)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            sale.ventEstado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                                                            sale.ventEstado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                            sale.ventEstado === 'PARCIAL' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {sale.ventEstado}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.ventFormaPago}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Mostrando página {salesList.pagination.page} de {salesList.pagination.total_pages} 
                                        ({salesList.pagination.total} ventas total)
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => loadSalesList(currentPage - 1)}
                                            disabled={!salesList.pagination.has_prev}
                                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ← Anterior
                                        </button>
                                        <button
                                            onClick={() => loadSalesList(currentPage + 1)}
                                            disabled={!salesList.pagination.has_next}
                                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Siguiente →
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Historial de Ventas por Vendedor */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-purple-600" />
                                <h2 className="text-xl font-semibold text-gray-900">Historial de Ventas por Vendedor</h2>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportSellerSalesHistory}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    CSV
                                </button>
                            </div>
                        </div>

                        {/* Resumen de ventas del vendedor seleccionado */}
                        {selectedSeller && sellerSalesHistory?.summary && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Vendedor</p>
                                    <p className="text-lg font-bold text-purple-900">
                                        {sellers.find(s => s.usuCod === selectedSeller)?.usuNombreCom || 'N/A'}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
                                    <p className="text-lg font-bold text-green-600">
                                        {formatCurrency(sellerSalesHistory.summary.total_amount)}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Cantidad</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {sellerSalesHistory.summary.total_sales}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Promedio por Venta</p>
                                    <p className="text-lg font-bold text-orange-600">
                                        {formatCurrency(sellerSalesHistory.summary.average_sale)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Filtros específicos para historial de vendedor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendedor (Opcional)
                                </label>
                                <select
                                    value={selectedSeller || ''}
                                    onChange={(e) => setSelectedSeller(e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">Todos los vendedores</option>
                                    {sellers.map(seller => (
                                        <option key={seller.usuCod} value={seller.usuCod}>
                                            {seller.usuNombreCom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Venta (Opcional)
                                </label>
                                <select
                                    value={selectedSaleType}
                                    onChange={(e) => setSelectedSaleType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">Todos los tipos</option>
                                    <option value="CONTADO">CONTADO</option>
                                    <option value="CREDITO">CRÉDITO</option>
                                </select>
                            </div>
                        </div>
                        
                        {sellerSalesHistory && (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Venta</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sellerSalesHistory.sales.map((sale: any) => (
                                                <tr key={sale.ventCod} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{sale.ventCod}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {new Date(sale.ventFecha).toLocaleDateString('es-PE')}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{sale.usuNombreCom}</td>
                                                    <td className="px-6 py-4 text-sm">{sale.cliNombreCom}</td>
                                                    <td className="px-6 py-4 text-sm">{sale.sucurNom}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            sale.ventFormaPago === 'CONTADO' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {sale.ventFormaPago}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                                                        {formatCurrency(sale.ventTotal)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            sale.ventEstado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                                                            sale.ventEstado === 'PARCIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {sale.ventEstado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Mostrando página {sellerSalesHistory.pagination.page} de {sellerSalesHistory.pagination.total_pages} 
                                        ({sellerSalesHistory.pagination.total} ventas total)
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => loadSellerSalesHistory(sellerHistoryPage - 1)}
                                            disabled={!sellerSalesHistory.pagination.has_prev}
                                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ← Anterior
                                        </button>
                                        <button
                                            onClick={() => loadSellerSalesHistory(sellerHistoryPage + 1)}
                                            disabled={!sellerSalesHistory.pagination.has_next}
                                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Siguiente →
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
