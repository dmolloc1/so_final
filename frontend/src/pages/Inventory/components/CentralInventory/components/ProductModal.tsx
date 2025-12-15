import React, { useState, useEffect } from 'react';
import { productService } from '../../../../../services/inventoryService';
import supplierService from '../../../../../services/supplierService';
import Modal from '../../../../../components/Modal/modal';
import type { Product, CreateProductDTO } from '../../../../../types/product';
import api from '../../../../../auth/services/api';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: () => void;
}

interface SelectOption {
  value: number;
  label: string;
}

const MARCAS = [
  'Ray-Ban',
  'Infinit',
  'Gucci',
  'Prada',
  'Vulk',
  'Otro',
];

const UNIDADES_MEDIDA = [
  { value: 'NIU', label: 'NIU - Unidad (bienes)' },
  { value: 'ZZ', label: 'ZZ - Unidad (servicios)' },
  { value: 'BX', label: 'BX - Caja' },
  { value: 'PK', label: 'PK - Paquete' },
  { value: 'SET', label: 'SET - Juego' },
  { value: 'PR', label: 'PR - Par' },
  { value: 'DZN', label: 'DZN - Docena' },
];

const TIPOS_IGV = [
  { value: '10', label: 'Gravado - Operación Onerosa (+18% IGV)' },
  { value: '20', label: 'Exonerado - Operación Onerosa' },
  { value: '30', label: 'Inafecto - Operación Onerosa' },
  { value: '40', label: 'Exportación' },
];

const MATERIALES_OPTICA = [
  { value: 'Metal', label: 'Metal' },
  { value: 'Acetato', label: 'Acetato' },
  { value: 'Titanio', label: 'Titanio' },
  { value: 'Acero Inoxidable', label: 'Acero Inoxidable' },
  { value: 'Aluminio', label: 'Aluminio' },
  { value: 'Plástico TR90', label: 'Plástico TR90' },
  { value: 'Policarbonato', label: 'Policarbonato' },
  { value: 'Madera', label: 'Madera' },
  { value: 'Fibra de Carbono', label: 'Fibra de Carbono' },
  { value: 'Pasta', label: 'Pasta' },
  { value: 'Carey', label: 'Carey' },
  { value: 'Silicona', label: 'Silicona' },
  { value: 'Goma', label: 'Goma' },
  { value: 'Mixto Metal-Acetato', label: 'Mixto Metal-Acetato' },
  { value: 'Oro 18K', label: 'Oro 18K' },
  { value: 'Acero Quirúrgico', label: 'Acero Quirúrgico' },
  { value: 'Otro', label: 'Otro' },
];

const PUBLICO_OBJETIVO = [
  { value: 'ADULTO', label: 'Adulto' },
  { value: 'JOVEN', label: 'Joven' },
  { value: 'NIÑO', label: 'Niño' },
  { value: 'BEBE', label: 'Bebé' },
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'TODOS', label: 'Todos' },
];

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState<CreateProductDTO>({
    catproCod: 0,
    provCod: 0,
    prodDescr: '',
    prodMarca: '',
    prodMate: '',
    prodPublico: 'ADULTO',
    prodCostoInv: 0,
    prodValorUni: 0,
    prodTipoAfecIGV: '10',
    prodUnidadMedi: 'NIU',
  });

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Cargar categorías y proveedores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadSelectData();
    }
  }, [isOpen]);

  // Actualizar formulario cuando cambia el producto
  useEffect(() => {
    if (product) {
      setFormData({
        catproCod: product.catproCod,
        provCod: product.provCod,
        prodDescr: product.prodDescr,
        prodMarca: product.prodMarca,
        prodMate: product.prodMate,
        prodPublico: product.prodPublico,
        prodCostoInv: parseFloat(product.prodCostoInv.toString()),
        prodValorUni: parseFloat(product.prodValorUni.toString()),
        prodTipoAfecIGV: product.prodTipoAfecIGV,
        prodUnidadMedi: product.prodUnidadMedi,
      });
    } else {
      // Formulario vacío para crear nuevo
      setFormData({
        catproCod: 0,
        provCod: 0,
        prodDescr: '',
        prodMarca: '',
        prodMate: '',
        prodPublico: 'ADULTO',
        prodCostoInv: 0,
        prodValorUni: 0,
        prodTipoAfecIGV: '10',
        prodUnidadMedi: 'NIU',
      });
    }
    setError('');
  }, [product, isOpen]);

  const loadSelectData = async () => {
    setLoadingData(true);
    try {
      // Cargar categorías
      const categoriesResponse = await api.get('/inventory/categories/');
      const categoriesData = categoriesResponse.data.results || categoriesResponse.data;
      const categoriesOptions = categoriesData.map((cat: any) => ({
        value: cat.catproCod,
        label: cat.catproNom,
      }));
      setCategories(categoriesOptions);

      // Cargar proveedores
      const suppliersData = await supplierService.getAll();
      const suppliersOptions = suppliersData.map((sup: any) => ({
        value: sup.provCod,
        label: sup.provRazSocial || sup.provNom,
      }));
      setSuppliers(suppliersOptions);

      // Auto-seleccionar primeros valores si está creando
      if (!product) {
        if (categoriesOptions.length > 0) {
          setFormData(prev => ({ ...prev, catproCod: categoriesOptions[0].value }));
        }
        if (suppliersOptions.length > 0) {
          setFormData(prev => ({ ...prev, provCod: suppliersOptions[0].value }));
        }
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar categorías y proveedores');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (formData.catproCod === 0) {
      setError('Selecciona una categoría');
      setLoading(false);
      return;
    }

    if (formData.provCod === 0) {
      setError('Selecciona un proveedor');
      setLoading(false);
      return;
    }

    if (formData.prodValorUni < formData.prodCostoInv) {
      setError('El precio de venta debe ser mayor o igual al costo');
      setLoading(false);
      return;
    }

    try {
      if (product) {
        await productService.update(product.prodCod, formData);
      } else {
        await productService.create(formData);
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error guardando producto:', err);
      setError(err.response?.data?.message || err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateProductDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Limpiar error al cambiar
  };

  const calcularPrecioConIGV = () => {
    if (formData.prodTipoAfecIGV === '10') {
      return (formData.prodValorUni * 1.18).toFixed(2);
    }
    return formData.prodValorUni.toFixed(2);
  };

  if (loadingData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando..." size="lg">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Editar Producto Global' : 'Crear Producto Global'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción * <span className="text-xs text-gray-500">(mín. 5 caracteres)</span>
            </label>
            <textarea
              value={formData.prodDescr}
              onChange={(e) => handleChange('prodDescr', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              required
              minLength={5}
              placeholder="Ej: Montura Ray-Ban Aviator metálica dorada"
            />
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca *
            </label>
            <select
              value={formData.prodMarca}
              onChange={(e) => handleChange('prodMarca', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccione marca</option>
              {MARCAS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material *
            </label>
            <select
              value={formData.prodMate}
              onChange={(e) => handleChange('prodMate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccione material</option>
              {MATERIALES_OPTICA.map(mat => (
                <option key={mat.value} value={mat.value}>
                  {mat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              value={formData.catproCod}
              onChange={(e) => handleChange('catproCod', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value={0}>Seleccione categoría</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor *
            </label>
            <select
              value={formData.provCod}
              onChange={(e) => handleChange('provCod', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value={0}>Seleccione proveedor</option>
              {suppliers.map(sup => (
                <option key={sup.value} value={sup.value}>
                  {sup.label}
                </option>
              ))}
            </select>
          </div>

          {/* Público Objetivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Público Objetivo *
            </label>
            <select
              value={formData.prodPublico}
              onChange={(e) => handleChange('prodPublico', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {PUBLICO_OBJETIVO.map(pub => (
                <option key={pub.value} value={pub.value}>
                  {pub.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unidad de Medida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad de Medida
            </label>
            <select
              value={formData.prodUnidadMedi}
              onChange={(e) => handleChange('prodUnidadMedi', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {UNIDADES_MEDIDA.map(uni => (
                <option key={uni.value} value={uni.value}>
                  {uni.label}
                </option>
              ))}
            </select>
          </div>

          {/* Costo de Inventario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo de Inventario * (S/.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.prodCostoInv}
              onChange={(e) => handleChange('prodCostoInv', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="0.00"
            />
          </div>

          {/* Valor Unitario (sin IGV) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Venta SIN IGV * (S/.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.prodValorUni}
              onChange={(e) => handleChange('prodValorUni', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="0.00"
            />
          </div>

          {/* Precio CON IGV (calculado) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Final CON IGV (S/.)
            </label>
            <input
              type="text"
              value={calcularPrecioConIGV()}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-medium"
            />
            <p className="mt-1 text-xs text-gray-500">Calculado automáticamente</p>
          </div>

          {/* Tipo de Afectación IGV */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Afectación IGV
            </label>
            <select
              value={formData.prodTipoAfecIGV}
              onChange={(e) => handleChange('prodTipoAfecIGV', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIPOS_IGV.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;