import React, { useState, useEffect } from 'react';
import { productService, inventoryService } from '../../../../services/inventoryService';
import { Package, AlertTriangle, TrendingDown, Plus, Edit2, Trash2, Barcode } from 'lucide-react';
import type { User } from '../../../../auth/types/user';
import type { Product, CreateProductDTO } from '../../../../types/product';
import LocalProductModal from './components/LocalProductModal';
import UpdateStockModal from './components/UpdateStockModal';
import DataTable from '../../../../components/Table/DataTable';
import type { Column } from '../../../../components/Table/DataTable';
import AddButton from '../../../../components/Common/AddButton';
import InventoryFiltersComponent from './components/InventoryFiltersComponent';
import supplierService from '../../../../services/supplierService';
import api from '../../../../auth/services/api';
import Modal from '../../../../components/Modal/modal';
import BarcodeDisplay from '../../../../shared/BarcodeDisplay';
import { notifyError, notifySuccess, notifyWarning } from '../../../../shared/notifications';

interface BranchInventoryProps {
  user: User;
}

interface ProductInBranch {
  producto_id: number;
  barcode: string;
  descripcion: string;
  marca: string;
  material: string;
  publico: string;
  origen: 'GLOBAL' | 'LOCAL';
  precio_venta_sin_igv: number;
  precio_venta_con_igv: number;
  stock_disponible: number;
  stock_minimo: number;
  bajo_stock: boolean;
  categoria: string;
  proveedor?: string;
  proveedor_id?: number;
  estado: string;
}

// Interfaz para los filtros
interface InventoryFilters {
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

const getEffectiveRole = (user: User): string => {
  const userRoles = user.roles.map(role => role.rolNom.toUpperCase());
  
  // Jerarquía de roles (de mayor a menor privilegio)
  if (userRoles.includes('GERENTE')) return 'GERENTE';
  if (userRoles.includes('SUPERVISOR')) return 'SUPERVISOR';
  if (userRoles.includes('LOGISTICA')) return 'LOGISTICA';
  if (userRoles.includes('VENDEDOR')) return 'VENDEDOR';
  
  return 'NONE';
};

const BranchInventory: React.FC<BranchInventoryProps> = ({ user }) => {
  const branchId = user.sucursal?.sucurCod || user.sucurCod || 0;

  // Determinar el rol efectivo (de mayor jerarquía)
  const effectiveRole = getEffectiveRole(user);

  // Solo es readOnly si el rol EFECTIVO es VENDEDOR (y no tiene roles superiores)
  const readOnly = effectiveRole === 'VENDEDOR';

  const [products, setProducts] = useState<ProductInBranch[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductInBranch[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log('Roles del usuario:', user.roles.map(r => r.rolNom));
  console.log('Rol efectivo:', effectiveRole);
  console.log('Modo readOnly:', readOnly);

  // Datos para filtros
  const [categories, setCategories] = useState<Array<{ catproCod: number; catproNom: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ provCod: number; provNom: string }>>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [materiales, setMateriales] = useState<string[]>([]);
  
  // Estado de filtros
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    filterLowStock: false,
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
  
  // Modals
  const [isLocalProductModalOpen, setIsLocalProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);

  // Estado para código de barras
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<ProductInBranch | null>(null);

  useEffect(() => {
    if (branchId) {
      loadBranchData();
      loadFilterData();
    }
  }, [branchId]);

  useEffect(() => {
    applyFilters();
    console.log("DataTable columns:", columns);
  }, [filters, products]);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      const data = await productService.getByBranch(branchId);
      
      const activeProducts = (data.productos || []).filter(
        (p: ProductInBranch) => p.estado === 'Active'
      );
      
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
    } catch (error) {
      console.error('Error al cargar datos de la sucursal:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterData = async () => {
    try {
      // Cargar categorías - verifica la estructura de respuesta
      const categoriesResponse = await api.get('/inventory/categories/');
      let categoriesData = [];
      
      if (Array.isArray(categoriesResponse.data)) {
        categoriesData = categoriesResponse.data;
      } else if (Array.isArray(categoriesResponse.data.results)) {
        categoriesData = categoriesResponse.data.results;
      } else if (Array.isArray(categoriesResponse.data.data)) {
        categoriesData = categoriesResponse.data.data;
      }
      
      setCategories(categoriesData);

      // Cargar proveedores - manejar posibles errores
      try {
        const suppliersData = await supplierService.getAll();
        const formattedSuppliers = Array.isArray(suppliersData) 
          ? suppliersData.map((s: any) => ({
              provCod: s.provCod || s.id,
              provNom: s.provRazSocial || s.provNom || s.nombre || 'Proveedor sin nombre'
            }))
          : [];
        setSuppliers(formattedSuppliers);
      } catch (supplierError) {
        console.error('Error al cargar proveedores:', supplierError);
        setSuppliers([]);
      }

      // Usar las listas estáticas para marcas y materiales
      const MARCAS = [
        'Ray-Ban',
        'Infinit',
        'Gucci',
        'Prada',
        'Vulk',
        'Artesanía Local',
        'Otro',
      ];

      const MATERIALES_OPTICA = [
        'Metal',
        'Acetato',
        'Titanio',
        'Acero Inoxidable',
        'Aluminio',
        'Plástico TR90',
        'Policarbonato',
        'Madera',
        'Fibra de Carbono',
        'Pasta',
        'Carey',
        'Silicona',
        'Goma',
        'Mixto Metal-Acetato',
        'Oro 18K',
        'Acero Quirúrgico',
        'Otro',
      ];

      setMarcas(MARCAS.sort());
      setMateriales(MATERIALES_OPTICA.sort());

    } catch (error) {
      console.error('Error al cargar datos de filtros:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.descripcion.toLowerCase().includes(searchLower) ||
          item.marca.toLowerCase().includes(searchLower) ||
          item.barcode.includes(filters.search)
      );
    }

    // Filtro de stock bajo
    if (filters.filterLowStock) {
      filtered = filtered.filter((item) => item.bajo_stock);
    }

    // Filtro con stock
    if (filters.conStock) {
      filtered = filtered.filter((item) => item.stock_disponible > 0);
    }

    // Filtro de marca
    if (filters.marca) {
      filtered = filtered.filter((item) => item.marca === filters.marca);
    }

    // Filtro de material
    if (filters.material) {
      filtered = filtered.filter((item) => item.material === filters.material);
    }

    // Filtro de público
    if (filters.publico) {
      filtered = filtered.filter((item) => item.publico === filters.publico);
    }

    // Filtro de origen
    if (filters.origen) {
      filtered = filtered.filter((item) => item.origen === filters.origen);
    }

    // Filtro de categoría - manejar diferentes casos
    if (filters.categoria) {
      // Buscar por código de categoría
      const category = categories.find(c => 
        c.catproCod.toString() === filters.categoria || 
        c.catproNom === filters.categoria
      );
      
      if (category) {
        filtered = filtered.filter((item) => 
          item.categoria === category.catproNom || 
          item.categoria === filters.categoria
        );
      }
    }

    // Filtro de proveedor - manejar diferentes casos
    if (filters.proveedor) {
      filtered = filtered.filter((item) => 
        item.proveedor_id?.toString() === filters.proveedor ||
        item.proveedor === filters.proveedor
      );
    }

    // Filtro de precio mínimo
    if (filters.precioMin) {
      const minPrice = parseFloat(filters.precioMin);
      filtered = filtered.filter((item) => item.precio_venta_con_igv >= minPrice);
    }

    // Filtro de precio máximo
    if (filters.precioMax) {
      const maxPrice = parseFloat(filters.precioMax);
      filtered = filtered.filter((item) => item.precio_venta_con_igv <= maxPrice);
    }

    setFilteredProducts(filtered);
  };

  // Funciones para código de barras
  const handleShowBarcode = (product: ProductInBranch) => {
    if (!product.barcode) {
      notifyWarning('Este producto no tiene código de barras generado.');
      return;
    }
    setBarcodeProduct(product);
    setShowBarcodeModal(true);
  };

  const handleGenerateBarcode = async (product: ProductInBranch) => {
    if (!window.confirm('¿Estás seguro de generar un código de barras para este producto?')) {
      return;
    }

    try {
      const response = await productService.regenerateBarcode(product.producto_id);
      const updated: Product = response.data || response;
      
      // Actualizar el producto en el estado
      setProducts(prev =>
        prev.map(p => p.producto_id === updated.prodCod ? 
          { ...p, barcode: updated.prodBarcode } : p
        )
      );
      setFilteredProducts(prev =>
        prev.map(p => p.producto_id === updated.prodCod ? 
          { ...p, barcode: updated.prodBarcode } : p
        )
      );
      
      // Mostrar el modal con el nuevo código
      setBarcodeProduct(prev => prev ? 
        { ...prev, barcode: updated.prodBarcode } : null
      );
      setShowBarcodeModal(true);
      
      notifySuccess('Código de barras generado exitosamente');
    } catch (error) {
      console.error('Error al generar código de barras:', error);
      notifyError('Error al generar el código de barras');
    }
  };

  const handleRegenerateBarcode = async () => {
    if (!barcodeProduct) return;

    if (!window.confirm('¿Estás seguro de regenerar el código de barras?')) {
      return;
    }

    try {
      const response = await productService.regenerateBarcode(barcodeProduct.producto_id);
      const updated: Product = response.data || response;
      
      // Actualizar el producto en el estado
      setProducts(prev =>
        prev.map(p => p.producto_id === updated.prodCod ? 
          { ...p, barcode: updated.prodBarcode } : p
        )
      );
      setFilteredProducts(prev =>
        prev.map(p => p.producto_id === updated.prodCod ? 
          { ...p, barcode: updated.prodBarcode } : p
        )
      );
      
      // Actualizar el producto en el modal
      setBarcodeProduct(prev => prev ? 
        { ...prev, barcode: updated.prodBarcode } : null
      );
      
      notifySuccess('Código de barras regenerado exitosamente');
    } catch (error) {
      console.error('Error al regenerar código de barras:', error);
      notifyError('Error al regenerar el código de barras');
    }
  };

  const handleCreateLocalProduct = async (data: CreateProductDTO) => {
    try {
      const newProduct = await productService.create(data);
      
      if (data.invStock !== undefined || data.invStockMin !== undefined) {
        await inventoryService.create({
          sucurCod: branchId,
          prodCod: newProduct.prodCod,
          invStock: data.invStock || 0,
          invStockMin: data.invStockMin || 0
        });
      }
      
      await loadBranchData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateLocalProduct = async (data: CreateProductDTO) => {
    if (!selectedProduct) return;
    try {
      await productService.update(selectedProduct.prodCod, data);
      await loadBranchData();
      setSelectedProduct(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteProduct = async (product: ProductInBranch) => {
    if (product.estado === 'Inactive') {
      notifyWarning('Este producto ya está inactivo');
      return;
    }

    if (!confirm(`¿Estás seguro de desactivar el producto "${product.descripcion}"?\n\nEl producto ya no aparecerá en el inventario pero se conservará su historial.`)) {
      return;
    }

    try {
      await productService.deactivate(product.producto_id);
      await loadBranchData();
      notifySuccess('Producto desactivado correctamente');
    } catch (error: any) {
      console.error('Error al desactivar producto:', error);
      const errorMsg = error.response?.data?.message || 'Error al desactivar el producto';
      notifyError(errorMsg);
    }
  };

  const handleEditProduct = async (product: ProductInBranch) => {
    try {
      const fullProduct = await productService.getById(product.producto_id);
      setSelectedProduct(fullProduct);
      setIsLocalProductModalOpen(true);
    } catch (error) {
      console.error('Error al cargar producto:', error);
    }
  };

  const handleUpdateStock = async (product: ProductInBranch) => {
    try {
      const invData = await inventoryService.getAll();
      const inventory = invData.find(
        inv => inv.producto_id === product.producto_id && inv.sucursal_id === branchId
      );
      
      if (inventory) {
        setSelectedProductForStock(inventory);
        setIsStockModalOpen(true);
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    }
  };

  // Definir columnas para la tabla
  const columns: Column<ProductInBranch>[] = [
    {
      key: 'barcode',
      label: 'Código',
      render: (row) => (
          <p className="text-sm font-mono text-gray-900">{row.barcode || 'Sin código'}</p>
      )
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.descripcion}</p>
        </div>
      )
    },
    {
      key: 'categoria',
      label: 'CATEGORIA',
      render: (row) => (
        <div>
          <p className="text-sm text-gray-900">{row.categoria}</p>
        </div>
      )
    },
    {
      key: 'marca',
      label: 'Marca',
      render: (row) => (
        <p className="text-sm text-gray-900">{row.marca}</p>
      )
    },
    {
      key: 'proveedor',
      label: 'Proveedor',
      render: (row) => (
        <p className="text-sm text-gray-700">{row.proveedor || 'N/A'}</p>
      )
    },
    {
      key: 'publico',
      label: 'Público',
      render: (row) => (
        <p className="text-sm text-gray-900">{row.publico}</p>
      )
    },
    {
      key: 'origen',
      label: 'Origen',
      render: (row) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            row.origen === 'GLOBAL'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {row.origen}
        </span>
      )
    },
    {
      key: 'stock_disponible',
      label: 'Stock Actual',
      render: (row) => (
        <div>
          <p
            className={`text-lg font-bold ${
              row.bajo_stock ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {row.stock_disponible}
          </p>
          {row.bajo_stock && (
            <p className="text-xs text-red-500">Bajo stock</p>
          )}
        </div>
      )
    },
    {
      key: 'precio_venta_con_igv',
      label: 'Precio de Venta',
      render: (row) => (
        <div className="text-center">
          <p className="text-sm font-bold text-green-600">
            S/ {row.precio_venta_con_igv.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            Sin IGV: S/ {row.precio_venta_sin_igv.toFixed(2)}
          </p>
        </div>
      )
    },
    {
      key: 'producto_id',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          
          {!readOnly && (
            <>
              {row.barcode ? (
                <button
                  onClick={() => handleShowBarcode(row)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Ver código de barras"
                >
                  <Barcode className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleGenerateBarcode(row)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110 animate-pulse"
                  title="Generar código de barras"
                >
                  <Barcode className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => handleUpdateStock(row)}
                className="p-2 bg-green-600 hover:bg-green-800 text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                title="Actualizar stock"
              >
                <Package className="w-4 h-4" />
              </button>
              
              {row.origen === 'LOCAL' && (
                <>
                  <button
                    onClick={() => handleEditProduct(row)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                    title="Editar producto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(row)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all hover:scale-110 shadow-sm"
                    title="Desactivar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const lowStockCount = products.filter((item) => item.bajo_stock).length;
  const totalValue = products.reduce(
    (sum, item) => sum + (item.precio_venta_sin_igv * item.stock_disponible), 
    0
  );
  const localProductsCount = products.filter((item) => item.origen === 'LOCAL').length;

  return (
    <div className="pt-15 px-15">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Inventario
          </h2>
          <p className="text-gray-600">
            {readOnly 
              ? 'Consulta los productos disponibles en tu sucursal' 
              : 'Gestiona el stock de productos en tu sucursal'
            }
          </p>
        </div>
        
        {!readOnly && (
          <AddButton
            onClick={() => {
              setSelectedProduct(null);
              setIsLocalProductModalOpen(true);
            }}
          >
            <Plus className="w-5 h-5" />
            Agregar Producto Local
          </AddButton>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-800">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-800">{lowStockCount}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-800">S/ {totalValue.toFixed(2)}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productos Locales</p>
              <p className="text-2xl font-bold text-gray-800">{localProductsCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <InventoryFiltersComponent
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
          suppliers={suppliers}
          marcas={marcas}
          materiales={materiales}
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
  <div className="max-h-[calc(100vh-400px)] overflow-y-auto"> {/* Altura dinámica */}
    <DataTable columns={columns} data={filteredProducts} />
  </div>
</div>

      {/* Modals */}
      <LocalProductModal
        isOpen={isLocalProductModalOpen}
        onClose={() => {
          setIsLocalProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={selectedProduct ? handleUpdateLocalProduct : handleCreateLocalProduct}
        product={selectedProduct}
      />

      {!readOnly && (
        <UpdateStockModal
          isOpen={isStockModalOpen}
          onClose={() => {
            setIsStockModalOpen(false);
            setSelectedProductForStock(null);
          }}
          inventoryItem={selectedProductForStock}
          onUpdate={loadBranchData}
        />
      )}

      {/* Modal de Código de Barras */}
      {barcodeProduct && barcodeProduct.barcode && showBarcodeModal && (
        <Modal
          isOpen={showBarcodeModal}
          onClose={() => setShowBarcodeModal(false)}
          title={`${barcodeProduct.marca} - ${barcodeProduct.descripcion}`}
          size="md"
        >
          <BarcodeDisplay
            code={barcodeProduct.barcode}
            productName={`${barcodeProduct.marca} - ${barcodeProduct.descripcion}`}
            onClose={() => setShowBarcodeModal(false)}
            onRegenerate={handleRegenerateBarcode}
          />
        </Modal>
      )}
    </div>
  );
};

export default BranchInventory;
