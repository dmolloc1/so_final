import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SaleFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
}

export interface FilterValues {
  search?: string;
  estado?: string;
  estado_recojo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

const SaleFilter = ({ onFilterChange, onClearFilters }: SaleFilterProps) => {
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    estado: '',
    estado_recojo: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    const emptyFilters: FilterValues = {
      search: '',
      estado: '',
      estado_recojo: '',
      fecha_desde: '',
      fecha_hasta: '',
    };
    setFilters(emptyFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white shadow-sm border border-gray-200 mb-6">
      <div className="p-4">
        {/* Barra de búsqueda principal */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, número de documento o código de venta..."
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3BAEDF] focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 border flex items-center gap-2 transition-colors ${
              showAdvanced 
                ? 'bg-[#3BAEDF] text-white border-[#3BAEDF]' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {/* Estado de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Pago
              </label>
              <select
                value={filters.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3BAEDF] focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIAL">Pago Parcial</option>
                <option value="PAGADO">Pagado</option>
              </select>
            </div>

            {/* Estado de Recojo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Recojo
              </label>
              <select
                value={filters.estado_recojo}
                onChange={(e) => handleInputChange('estado_recojo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3BAEDF] focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_LABORATORIO">En Laboratorio</option>
                <option value="LISTO">Listo para Recoger</option>
                <option value="ENTREGADO">Entregado</option>
              </select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filters.fecha_desde}
                onChange={(e) => handleInputChange('fecha_desde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3BAEDF] focus:border-transparent"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filters.fecha_hasta}
                onChange={(e) => handleInputChange('fecha_hasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3BAEDF] focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleFilter;