import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface InventoryFilters {
  search: string;
  filterLowStock: boolean;
  marca: string;
  material: string;
  publico: string;
  origen: string;
  categoria: string;
  proveedor: string;
  precioMin: string;
  precioMax: string;
  conStock: boolean;
}

interface InventoryFiltersProps {
  filters: InventoryFilters;
  onFilterChange: (filters: InventoryFilters) => void;
  categories: Array<{ catproCod: number; catproNom: string }>;
  suppliers: Array<{ provCod: number; provNom: string }>;
  marcas?: string[];
  materiales?: string[];
}

const PUBLICO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ADULTO', label: 'Adulto' },
  { value: 'JOVEN', label: 'Joven' },
  { value: 'NIÑO', label: 'Niño' },
  { value: 'BEBE', label: 'Bebé' },
  { value: 'UNISEX', label: 'Unisex' },
];

const ORIGEN_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'GLOBAL', label: 'Global' },
  { value: 'LOCAL', label: 'Local' },
];

const InventoryFiltersComponent: React.FC<InventoryFiltersProps> = ({
  filters,
  onFilterChange,
  categories,
  suppliers,
  marcas = [],
  materiales = [],
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof InventoryFilters, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = () => {
    return (
      filters.marca ||
      filters.material ||
      filters.publico ||
      filters.origen ||
      filters.categoria ||
      filters.proveedor ||
      filters.precioMin ||
      filters.precioMax ||
      filters.conStock
    );
  };

  const clearAllFilters = () => {
    onFilterChange({
      search: filters.search, // Mantener la búsqueda
      filterLowStock: filters.filterLowStock, // Mantener filtro de stock bajo
      marca: '',
      material: '',
      publico: '',
      origen: '',
      categoria: '',
      proveedor: '',
      precioMin: '',
      precioMax: '',
      conStock: false,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Barra de filtros básicos */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Búsqueda */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por código, descripción o marca..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Botón Stock Bajo */}
          <button
            onClick={() => handleChange('filterLowStock', !filters.filterLowStock)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              filters.filterLowStock
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filters.filterLowStock ? 'Stock Bajo Activo' : 'Stock Bajo'}
          </button>

          {/* Botón Con Stock */}
          <button
            onClick={() => handleChange('conStock', !filters.conStock)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              filters.conStock
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filters.conStock ? 'Solo con Stock' : 'Con Stock'}
          </button>

          {/* Botón Filtros Avanzados */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              showAdvanced || hasActiveFilters()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros Avanzados
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {hasActiveFilters() && !showAdvanced && (
              <span className="ml-1 bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panel de filtros avanzados */}
      {showAdvanced && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">Filtros Avanzados</h3>
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={filters.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.catproCod} value={cat.catproCod}>
                    {cat.catproNom}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No hay categorías disponibles</p>
              )}
            </div>

            {/* Marca */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Marca
              </label>
              <select
                value={filters.marca}
                onChange={(e) => handleChange('marca', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todas las marcas</option>
                {marcas.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            {/* Material */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Material
              </label>
              <select
                value={filters.material}
                onChange={(e) => handleChange('material', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todos los materiales</option>
                {materiales.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
            </div>

            {/* Público */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Público
              </label>
              <select
                value={filters.publico}
                onChange={(e) => handleChange('publico', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {PUBLICO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Origen */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Origen
              </label>
              <select
                value={filters.origen}
                onChange={(e) => handleChange('origen', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {ORIGEN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <select
                value={filters.proveedor}
                onChange={(e) => handleChange('proveedor', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todos los proveedores</option>
                {suppliers.map((sup) => (
                  <option key={sup.provCod} value={sup.provCod}>
                    {sup.provNom}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No hay proveedores disponibles</p>
              )}
            </div>

            {/* Precio Mínimo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Precio Mínimo (S/.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={filters.precioMin}
                onChange={(e) => handleChange('precioMin', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Precio Máximo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Precio Máximo (S/.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="999.99"
                value={filters.precioMax}
                onChange={(e) => handleChange('precioMax', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Indicador de filtros activos */}
          {hasActiveFilters() && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-medium text-gray-600">Filtros activos:</span>
              {filters.categoria && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Categoría
                  <button
                    onClick={() => handleChange('categoria', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.marca && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Marca: {filters.marca}
                  <button
                    onClick={() => handleChange('marca', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.material && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Material: {filters.material}
                  <button
                    onClick={() => handleChange('material', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.publico && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Público: {filters.publico}
                  <button
                    onClick={() => handleChange('publico', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.origen && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Origen: {filters.origen}
                  <button
                    onClick={() => handleChange('origen', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.proveedor && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Proveedor
                  <button
                    onClick={() => handleChange('proveedor', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.precioMin && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Min: S/ {filters.precioMin}
                  <button
                    onClick={() => handleChange('precioMin', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.precioMax && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Max: S/ {filters.precioMax}
                  <button
                    onClick={() => handleChange('precioMax', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.conStock && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Con Stock
                  <button
                    onClick={() => handleChange('conStock', false)}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryFiltersComponent;