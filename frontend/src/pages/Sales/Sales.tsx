import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import SaleFilter from './components/SalesFilter';
import type { FilterValues } from './components/SalesFilter';
import SaleCard from './components/SaleCard';
import { saleService } from '../../services/saleService';
import type { VentaResponse } from '../../types/sale';
import { useCurrentBranchName } from '../../hooks/useCurrentBranchName';

const Sales = () => {
  const selectedBranchName = useCurrentBranchName();
  const [ventas, setVentas] = useState<VentaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({});

  const fetchVentas = async (filterParams?: FilterValues) => {
    try {
      setLoading(true);
      setError(null);

      // Preparar parámetros, removiendo valores vacíos
      const params: any = {};
      if (filterParams?.search) params.search = filterParams.search;
      if (filterParams?.estado) params.estado = filterParams.estado;
      if (filterParams?.estado_recojo) params.estado_recojo = filterParams.estado_recojo;
      if (filterParams?.fecha_desde) params.fecha_desde = filterParams.fecha_desde;
      if (filterParams?.fecha_hasta) params.fecha_hasta = filterParams.fecha_hasta;

      const data = await saleService.getVentas(params);
      setVentas(data);
    } catch (err: any) {
      console.error('Error al cargar ventas:', err);
      setError(err.response?.data?.message || 'Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    fetchVentas(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    fetchVentas({});
  };

  const handleVentaActualizada = () => {
    // Recargar ventas después de actualizar
    fetchVentas(filters);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="pt-10 px-10">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
            <p className="text-gray-600 mt-1">Gestiona y visualiza todas las ventas realizadas</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-gray-600">Sucursal:</span>
            <span className="text-sm font-bold text-blue-700">{selectedBranchName}</span>
          </div>
        </div>
        {/* Filtros */}
        <SaleFilter
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Contenido Principal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-[#3BAEDF] animate-spin mb-4" />
            <p className="text-gray-600">Cargando ventas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-900 font-semibold mb-1">Error al cargar las ventas</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => fetchVentas(filters)}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : ventas.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron ventas
              </h3>
              <p className="text-gray-600 mb-6">
                {Object.values(filters).some(v => v !== '')
                  ? 'No hay ventas que coincidan con los filtros aplicados.'
                  : 'Aún no se han registrado ventas en el sistema.'}
              </p>
              {Object.values(filters).some(v => v !== '') && (
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-[#3BAEDF] text-white rounded hover:bg-[#2A9DC9] transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            <div className="mb-4 text-sm text-gray-600">
              Mostrando <span className="font-semibold text-gray-900">{ventas.length}</span> {ventas.length === 1 ? 'venta' : 'ventas'}
            </div>

            {/* Grid de Ventas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ventas.map((venta) => (
                <SaleCard
                  key={venta.ventCod}
                  venta={venta}
                  onVentaActualizada={handleVentaActualizada}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sales;