import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import supplierService from '../../../../../services/supplierService';
import api from '../../../../../auth/services/api';
import type { Product, CreateProductDTO } from '../../../../../types/product';
import Modal from '../../../../../components/Modal/modal';
import FormInput from '../../../../../components/Forms/FormInput';
import AddButton from '../../../../../components/Common/AddButton';

interface LocalProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProductDTO) => Promise<void>;
  product?: Product | null;
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
  'Artesanía Local',
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

const LocalProductModal: React.FC<LocalProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SelectOption[]>([]);
  
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
    invStock: 0,
    invStockMin: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadSelectData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        catproCod: product.catproCod,
        provCod: product.provCod,
        prodDescr: product.prodDescr,
        prodMarca: product.prodMarca,
        prodMate: product.prodMate,
        prodPublico: product.prodPublico,
        prodCostoInv: typeof product.prodCostoInv === 'string' 
          ? parseFloat(product.prodCostoInv) 
          : product.prodCostoInv,
        prodValorUni: typeof product.prodValorUni === 'string'
          ? parseFloat(product.prodValorUni)
          : product.prodValorUni,
        prodTipoAfecIGV: product.prodTipoAfecIGV,
        prodUnidadMedi: product.prodUnidadMedi
      });
    } else if (!product && isOpen) {
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
        invStock: 0,
        invStockMin: 0
      });
    }
    setError('');
  }, [product, isOpen]);

  const loadSelectData = async () => {
    setLoadingData(true);
    try {
      const categoriesResponse = await api.get('/inventory/categories/');
      const categoriesData = categoriesResponse.data.results || categoriesResponse.data;
      const categoriesOptions = categoriesData.map((cat: any) => ({
        value: cat.catproCod,
        label: cat.catproNom,
      }));
      setCategories(categoriesOptions);

      const suppliersData = await supplierService.getAll();
      const suppliersOptions = suppliersData.map((sup: any) => ({
        value: sup.provCod,
        label: sup.provRazSocial || sup.provNom,
      }));
      setSuppliers(suppliersOptions);

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

  const handleChange = (field: keyof CreateProductDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const calcularPrecioConIGV = () => {
    if (formData.prodTipoAfecIGV === '10') {
      return (formData.prodValorUni * 1.18).toFixed(2);
    }
    return formData.prodValorUni.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prodDescr.trim() || formData.prodDescr.length < 5) {
      setError('La descripción debe tener al menos 5 caracteres');
      return;
    }
    
    if (!formData.prodMarca.trim()) {
      setError('La marca es obligatoria');
      return;
    }
    
    if (!formData.prodMate.trim()) {
      setError('El material es obligatorio');
      return;
    }
    
    if (formData.catproCod === 0) {
      setError('Selecciona una categoría');
      return;
    }
    
    if (formData.provCod === 0) {
      setError('Selecciona un proveedor');
      return;
    }

    if (formData.prodCostoInv <= 0) {
      setError('El costo de inventario debe ser mayor a 0');
      return;
    }

    if (formData.prodValorUni <= 0) {
      setError('El precio de venta debe ser mayor a 0');
      return;
    }

    if (formData.prodValorUni < formData.prodCostoInv) {
      setError('El precio de venta debe ser mayor o igual al costo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={product ? 'Editar Producto Local' : 'Nuevo Producto Local'}
        size="lg"
      >
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
      title={product ? 'Editar Producto Local' : 'Nuevo Producto Local'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
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
              placeholder="Ej: Montura artesanal de madera con diseño exclusivo"
            />
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca * <span className="text-red-500 ml-1">*</span>
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
              Material * <span className="text-red-500 ml-1">*</span>
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
              Categoría * <span className="text-red-500 ml-1">*</span>
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
              Proveedor * <span className="text-red-500 ml-1">*</span>
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
              Público Objetivo * <span className="text-red-500 ml-1">*</span>
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

          {/* Costo y Precio */}
          <FormInput
            label="Costo de Inventario (S/.)"
            type="number"
            name="prodCostoInv"
            value={formData.prodCostoInv.toString()}
            onChange={(e) => handleChange('prodCostoInv', parseFloat(e.target.value) || 0)}
            required
            placeholder="0.00"
          />

          <FormInput
            label="Precio Venta SIN IGV (S/.)"
            type="number"
            name="prodValorUni"
            value={formData.prodValorUni.toString()}
            onChange={(e) => handleChange('prodValorUni', parseFloat(e.target.value) || 0)}
            required
            placeholder="0.00"
          />

          {/* Precio CON IGV */}
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

          {!product && (
            <>
              <FormInput
                label="Stock Inicial"
                type="number"
                name="invStock"
                value={formData.invStock?.toString() || '0'}
                onChange={(e) => handleChange('invStock', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <AddButton type="submit" disabled={loading}>
            {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
          </AddButton>
        </div>
      </form>
    </Modal>
  );
};

export default LocalProductModal;