import { useState, useEffect } from 'react';
import { reportsService, type CashReportData } from '../../../../services/reportsService';
import { branchService } from '../../../../services/branchService';
import type { Branch } from '../../../../types/branch';
import { DollarSign, Filter, Download, Printer, TrendingUp, User, Calendar, Wallet } from 'lucide-react';

export default function CashReports() {
    const [loading, setLoading] = useState(false);
    const [cashOpenings, setCashOpenings] = useState<CashReportData | null>(null);
    const [selectedCashOpening, setSelectedCashOpening] = useState<number | undefined>(undefined);
    const [cashReport, setCashReport] = useState<CashReportData | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<number | undefined>(undefined);
    const [branches, setBranches] = useState<Branch[]>([]);

    useEffect(() => {
        loadBranches();

        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            loadCashOpenings();
        }
    }, [startDate, endDate, selectedBranch]);

    const loadBranches = async () => {
        try {
            const data = await branchService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error('Error loading branches:', error);
        }
    };

    const loadCashOpenings = async () => {
        setLoading(true);
        try {
            const filters = {
                start_date: startDate,
                end_date: endDate,
                branch_id: selectedBranch
            };

            const data = await reportsService.getCashReport(filters);
            setCashOpenings(data);
            setSelectedCashOpening(undefined);
            setCashReport(null);
        } catch (error) {
            console.error('Error loading cash openings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCashReport = async (cashOpeningId: number) => {
        setLoading(true);
        try {
            const data = await reportsService.getCashReport({ cash_opening_id: cashOpeningId });
            setCashReport(data);
            setSelectedCashOpening(cashOpeningId);
        } catch (error) {
            console.error('Error loading cash report:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <Wallet className="w-7 h-7 text-green-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Reportes por Caja</h1>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sucursal (Opcional)
                        </label>
                        <select
                            value={selectedBranch || ''}
                            onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
                            onClick={loadCashOpenings}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-4 text-gray-600">Cargando reportes...</p>
                </div>
            ) : (
                <>
                    {/* Lista de Sesiones de Caja */}
                    {!selectedCashOpening && cashOpenings?.cash_openings && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Sesiones de Caja</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caja</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apertura</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cierre</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto Inicial</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ventas</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {cashOpenings.cash_openings.map((opening) => (
                                            <tr key={opening.cajaAperCod} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">{opening.cajaAperCod}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{opening.cajNom}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{opening.usuNombreCom}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{opening.sucurNom}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(opening.cajaApertuFechHora)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {opening.cajaAperFechaHorCierre ? formatDateTime(opening.cajaAperFechaHorCierre) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(opening.cajaAperMontInicial)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">{opening.ventas_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">{formatCurrency(opening.ventas_total)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${opening.cajaAperEstado === 'ABIERTA' ? 'bg-green-100 text-green-800' :
                                                            opening.cajaAperEstado === 'CERRADA' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {opening.cajaAperEstado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => loadCashReport(opening.cajaAperCod)}
                                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                    >
                                                        Ver Detalle
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Reporte Detallado de Caja */}
                    {selectedCashOpening && cashReport?.cash_opening && (
                        <div className="space-y-6">
                            {/* Botón Volver */}
                            <button
                                onClick={() => {
                                    setSelectedCashOpening(undefined);
                                    setCashReport(null);
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                ← Volver a Lista
                            </button>

                            {/* Info de la Sesión */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold">Sesión #{cashReport.cash_opening.cajaAperCod}</h3>
                                        <p className="text-gray-600">{cashReport.cash_opening.cajNom} - {cashReport.cash_opening.sucurNom}</p>
                                        <p className="text-sm text-gray-500">Cajero: {cashReport.cash_opening.usuNombreCom}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full ${cashReport.cash_opening.cajaAperEstado === 'ABIERTA' ? 'bg-green-100 text-green-800' :
                                            cashReport.cash_opening.cajaAperEstado === 'CERRADA' ? 'bg-gray-100 text-gray-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                        {cashReport.cash_opening.cajaAperEstado}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Fecha Apertura</p>
                                        <p className="font-semibold">{formatDateTime(cashReport.cash_opening.cajaApertuFechHora)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Fecha Cierre</p>
                                        <p className="font-semibold">
                                            {cashReport.cash_opening.cajaAperFechaHorCierre
                                                ? formatDateTime(cashReport.cash_opening.cajaAperFechaHorCierre)
                                                : 'En curso'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjetas de Resumen */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h4 className="text-sm font-medium text-gray-600">Monto Inicial</h4>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(cashReport.cash_opening.cajaAperMontInicial)}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h4 className="text-sm font-medium text-gray-600">Total Ventas</h4>
                                    <p className="text-2xl font-bold text-green-600 mt-2">
                                        {formatCurrency(cashReport.totales?.total_ventas || 0)}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {cashReport.totales?.cantidad_ventas || 0} transacciones
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h4 className="text-sm font-medium text-gray-600">Monto Esperado</h4>
                                    <p className="text-2xl font-bold text-blue-600 mt-2">
                                        {formatCurrency(cashReport.cash_opening.cajaAperMontEsperado || 0)}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow">
                                    <h4 className="text-sm font-medium text-gray-600">Diferencia</h4>
                                    <p className={`text-2xl font-bold mt-2 ${(cashReport.cash_opening.cajaAperDiferencia || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {cashReport.cash_opening.cajaAperDiferencia !== null
                                            ? formatCurrency(cashReport.cash_opening.cajaAperDiferencia)
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Totales IGV */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Desglose de IGV</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-gray-50 p-4 rounded">
                                        <p className="text-xs text-gray-600">Subtotal (Base Imponible)</p>
                                        <p className="text-lg font-bold">{formatCurrency(cashReport.totales?.total_subtotal || 0)}</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded">
                                        <p className="text-xs text-gray-600">Total Gravada</p>
                                        <p className="text-lg font-bold text-blue-700">{formatCurrency(cashReport.totales?.total_gravada || 0)}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded">
                                        <p className="text-xs text-gray-600">IGV (18%)</p>
                                        <p className="text-lg font-bold text-green-700">{formatCurrency(cashReport.totales?.total_igv || 0)}</p>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded">
                                        <p className="text-xs text-gray-600">Exonerada</p>
                                        <p className="text-lg font-bold text-yellow-700">{formatCurrency(cashReport.totales?.total_exonerada || 0)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Formas de Pago */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Totales por Forma de Pago</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {cashReport.por_forma_pago?.map((pago, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded">
                                            <p className="text-sm text-gray-600">{pago.ventFormaPago}</p>
                                            <p className="text-xl font-bold">{formatCurrency(pago.total)}</p>
                                            <p className="text-xs text-gray-500">{pago.cantidad} transacciones</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Listado de Ventas */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Ventas Registradas</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGV</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {cashReport.ventas?.map((venta) => (
                                                <tr key={venta.ventCod} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{venta.ventCod}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(venta.ventFecha)}</td>
                                                    <td className="px-6 py-4 text-sm">{venta.cliNombreCom}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{venta.cliDocNum}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(venta.ventSubTotal)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">{formatCurrency(venta.ventIGV)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">{formatCurrency(venta.ventTotal)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{venta.ventFormaPago}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${venta.ventEstado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                                                                venta.ventEstado === 'PARCIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {venta.ventEstado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
