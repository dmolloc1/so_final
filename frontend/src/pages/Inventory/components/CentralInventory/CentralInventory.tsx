import React, { useState, useEffect } from 'react';
import { productService } from '../../../../services/inventoryService';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, Barcode } from 'lucide-react';
import DataTable from '../../../../components/Table/DataTable';
import type { Column } from '../../../../components/Table/DataTable';
import ProductModal from './components/ProductModal';
import type { User } from '../../../../auth/types/user';
import type { Product } from '../../../../types/product';
import Modal from '../../../../components/Modal/modal';
import BarcodeDisplay from '../../../../shared/BarcodeDisplay';
import { useCurrentBranchName } from '../../../../hooks/useCurrentBranchName';

interface CentralInventoryProps {
  user: User;
}

interface ProductWithCentralStock extends Product {
  total_stock_central?: number;
}

const CentralInventory: React.FC<CentralInventoryProps> = ({ }) => {
  const selectedBranchName = useCurrentBranchName();
  const [products, setProducts] = useState<ProductWithCentralStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithCentralStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };


  useEffect(() => {
    fetchProducts();
    loadProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.prodOrigin === 'GLOBAL' &&
        (product.prodDescr.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.prodMarca.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.prodBarcode && product.prodBarcode.includes(searchTerm)))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      const globalProducts = data.filter((p) => p.prodOrigin === 'GLOBAL');
      const centralStock = await productService.getCentralStock();
      const merged: ProductWithCentralStock[] = globalProducts.map((prod) => {
        const match = centralStock.find((c) => c.producto_id === prod.prodCod);

        return {
          ...prod,
          total_stock_central: match ? match.total_stock_central : 0,
        };
      });

      setProducts(merged);
      setFilteredProducts(merged);
    } catch (error) {
      alert('Error al cargar los productos. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeactivate = async (id: number) => {
    try {
      await productService.deactivate(id);
      setDeleteConfirm(null);
      fetchProducts(); // recargar la lista
    } catch (error) {
      console.error("Error desactivando producto:", error);
    }
  };



  const handleSave = () => {
    console.log('✅ Producto guardado, recargando lista...');
    loadProducts();
  };

  const handleShowBarcode = (product: Product) => {
    if (!product.prodBarcode) {
      alert('Este producto no tiene código de barras generado.');
      return;
    }
    setBarcodeProduct(product);
    setShowBarcodeModal(true);
  };

  const handleGenerateBarcode = async (product: Product) => {
    if (!window.confirm('¿Estás seguro de generar un código de barras para este producto?')) {
      return;
    }

    try {
      const response = await productService.regenerateBarcode(product.prodCod);
      const updated: Product = response.data || response;

      setProducts(prev =>
        prev.map(p => p.prodCod === updated.prodCod ? { ...updated, total_stock_central: p.total_stock_central } : p)
      );
      setFilteredProducts(prev =>
        prev.map(p => p.prodCod === updated.prodCod ? { ...updated, total_stock_central: p.total_stock_central } : p)
      );

      setBarcodeProduct(updated);
      setShowBarcodeModal(true);

      alert('Código de barras generado exitosamente');
    } catch (error) {
      console.error('Error al generar código de barras:', error);
      alert('Error al generar el código de barras');
    }
  };

  const handleRegenerateBarcode = async () => {
    if (!barcodeProduct) return;

    if (!window.confirm('¿Estás seguro de regenerar el código de barras?')) {
      return;
    }

    try {
      const response = await productService.regenerateBarcode(barcodeProduct.prodCod);
      const updated: Product = response.data || response;

      setProducts(prev =>
        prev.map(p => p.prodCod === updated.prodCod ? { ...updated, total_stock_central: p.total_stock_central } : p)
      );
      setFilteredProducts(prev =>
        prev.map(p => p.prodCod === updated.prodCod ? { ...updated, total_stock_central: p.total_stock_central } : p)
      );

      setBarcodeProduct(updated);

      alert('Código de barras regenerado exitosamente');
    } catch (error) {
      console.error('Error al regenerar código de barras:', error);
      alert('Error al regenerar el código de barras');
    }
  };

  // Definir columnas para el DataTable
  const columns: Column<ProductWithCentralStock>[] = [
    {
      key: 'prodCod',
      label: 'CÓDIGO',
      render: (product) => (
        <div>
          <p className="text-sm font-medium text-gray-700">{product.prodBarcode || 'Sin código'}</p>
        </div>
      ),
    },
    {
      key: 'prodDescr',
      label: 'DESCRIPCIÓN',
      render: (product) => (
        <span className="text-md text-gray-700">{product.prodDescr}</span>
      ),
    },
    {
      key: 'total_stock_central',
      label: 'STOCK CENTRAL',
      render: (product) => (
        <span className="text-md font-semibold text-gray-800">
          {product.total_stock_central ?? 0}
        </span>
      ),
    },
    {
      key: 'categoria_nombre',
      label: 'CATEGORÍA',
      render: (product) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {product.categoria_nombre || 'Sin categoría'}
        </span>
      ),
    },
    {
      key: 'prodMate',
      label: 'MATERIAL',
      render: (product) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {product.prodMate}
        </span>
      ),
    },
    {
      key: 'prodPublico',
      label: 'PÚBLICO',
      render: (product) => {
        const publicoColors: { [key: string]: string } = {
          ADULTO: 'bg-blue-100 text-blue-800',
          JOVEN: 'bg-green-100 text-green-800',
          NIÑO: 'bg-yellow-100 text-yellow-800',
          BEBE: 'bg-pink-100 text-pink-800',
          UNISEX: 'bg-indigo-100 text-indigo-800',
          TODOS: 'bg-purple-100 text-purple-800',
        };

        const publicoLabels: { [key: string]: string } = {
          ADULTO: 'Adulto',
          JOVEN: 'Joven',
          NIÑO: 'Niño',
          BEBE: 'Bebé',
          UNISEX: 'Unisex',
          TODOS: 'Todos',
        };

        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${publicoColors[product.prodPublico] || 'bg-gray-100 text-gray-800'}`}>
            {publicoLabels[product.prodPublico] || product.prodPublico}
          </span>
        );
      },
    },
    {
      key: 'prodUnidadMedi',
      label: 'UNIDAD',
      render: (product) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
          {product.prodUnidadMedi}
        </span>
      ),
    },
    {
      key: 'precioVentaConIGV',
      label: 'PRECIO VENTA',
      render: (product) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            S/ {product.precioVentaConIGV ? product.precioVentaConIGV.toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-gray-500">con IGV</p>
        </div>
      ),
    },
    {
      key: 'margenGanancia',
      label: 'MARGEN',
      render: (product) => {
        const margen = product.margenGanancia || 0;
        let colorClass = 'bg-gray-100 text-gray-800';

        if (margen >= 30) {
          colorClass = 'bg-green-100 text-green-800';
        } else if (margen >= 15) {
          colorClass = 'bg-yellow-100 text-yellow-800';
        } else if (margen > 0) {
          colorClass = 'bg-orange-100 text-orange-800';
        } else {
          colorClass = 'bg-red-100 text-red-800';
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {margen.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'prodEstado',
      label: 'ESTADO',
      render: (product) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.prodEstado === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
            }`}
        >
          {product.prodEstado === 'Active' ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      render: (product) => (
        <div className="flex items-center justify-center gap-2">
          {product.prodBarcode ? (
            <button
              onClick={() => handleShowBarcode(product)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
              title="Ver código de barras"
            >
              <Barcode className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => handleGenerateBarcode(product)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110 animate-pulse"
              title="Generar código de barras"
            >
              <Barcode className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => handleEdit(product)}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all hover:scale-110 shadow-sm"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {deleteConfirm === product.prodCod ? (
            <div className="flex gap-1">
              <button
                onClick={() => handleDeactivate(product.prodCod)}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-sm"
              >
                Confirmar
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(product.prodCod)}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all hover:scale-110 shadow-sm"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pt-15 px-15 ">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventario Central</h1>
          <p className="text-gray-600">
            Gestiona los productos globales disponibles para todas las sucursales
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-gray-600">Sucursal:</span>
          <span className="text-sm font-bold text-blue-700">{selectedBranchName}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-800">{filteredProducts.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productos Activos</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredProducts.filter((p) => p.prodEstado === 'Active').length}
              </p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-gray-800">
                {new Set(filteredProducts.map((p) => p.categoria_nombre).filter(Boolean)).size}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por descripción, marca o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto Global
          </button>
        </div>
      </div>

      {/* Products Table usando DataTable */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable columns={columns} data={filteredProducts} />
      </div>

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSave={handleSave}
      />

      {/* Modal de Código de Barras */}
      {barcodeProduct && barcodeProduct.prodBarcode && showBarcodeModal && (
        <Modal
          isOpen={showBarcodeModal}
          onClose={() => setShowBarcodeModal(false)}
          title={`${barcodeProduct.prodMarca} - ${barcodeProduct.prodDescr}`}
          size="md"
        >
          <BarcodeDisplay
            code={barcodeProduct.prodBarcode}
            productName={`${barcodeProduct.prodMarca} - ${barcodeProduct.prodDescr}`}
            onClose={() => setShowBarcodeModal(false)}
            onRegenerate={handleRegenerateBarcode}
          />
        </Modal>
      )}
    </div>
  );
};

export default CentralInventory;