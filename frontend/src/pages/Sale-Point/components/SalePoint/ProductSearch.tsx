import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader, Barcode } from 'lucide-react';
import type { Product } from '../../../../types/product';
import { productService } from '../../../../services/inventoryService';
import { getCurrentUser } from '../../../../auth/services/userService';
import { notifyWarning } from '../../../../shared/notifications';

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProductSelect: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  searchQuery,
  onSearchChange,
  onProductSelect
}) => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [currentSucursal, setCurrentSucursal] = useState<number | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Obtener la sucursal del usuario al montar el componente
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        // Verificar que sucurCod existe y es un número
        if (user.sucurCod !== undefined && user.sucurCod !== null) {
          setCurrentSucursal(user.sucurCod);
          console.log('Usuario logeado:', user.usuNom, 'Sucursal:', user.sucurCod);
        } else {
          console.warn('Usuario no tiene sucursal asignada, usando fallback');
          setCurrentSucursal(1); // Fallback
        }
      } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
        setCurrentSucursal(1); // Fallback
      }
    };
  
    fetchCurrentUser();
  }, []);
  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim() && currentSucursal) {
      const timeout = setTimeout(() => {
        performSearch(searchQuery);
      }, 300); // 300ms debounce

      searchTimeoutRef.current = timeout;
    } else if (searchQuery.trim()) {
      // Si hay query pero no tenemos sucursal aún, mostrar loading
      setLoading(true);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, currentSucursal]);

  
  const performSearch = async (query: string) => {
    if (!currentSucursal) {
      console.warn('No hay sucursal definida');
      return;
    }
  
    try {
      setLoading(true);
      
      let results: Product[] = [];

      try {
        const branchResponse = await productService.getByBranch(currentSucursal);
        const sucursalProducts = branchResponse.productos;
        
        const mappedProducts: Product[] = sucursalProducts.map((item: any) => ({
          prodCod: item.producto_id,
          prodDescr: item.descripcion,
          prodMarca: item.marca,
          prodBarcode: item.barcode,
          prodValorUni: item.precio_venta_sin_igv, 
          precioVentaConIGV: item.precio_venta_con_igv,
          montoIGV: item.precio_venta_con_igv - item.precio_venta_sin_igv, 
          stock_disponible: item.stock_disponible,
          total_stock_central: item.stock_disponible,
          
         
          prodMate: item.material || '',
          prodPublico: item.publico || 'TODOS',
          prodTipoAfecIGV: '10', // Por defecto
          prodUnidadMedi: 'NIU', // Por defecto
          prodOrigin: item.origen || 'GLOBAL',
          prodEstado: item.estado || 'Active',
          branchOwner: null,
          provCod: item.proveedor_id,
          is_active: item.estado === 'Active',
          sucursal_nombre: null,
          categoria_nombre: item.categoria || '',
          proveedor_nombre: item.proveedor || '',
        }));
  
        if (/^\d+$/.test(query)) {
          results = mappedProducts.filter(product => 
            product.prodBarcode === query
          );
        } else {
          results = mappedProducts.filter(product =>
            product.prodDescr.toLowerCase().includes(query.toLowerCase()) ||
            product.prodMarca.toLowerCase().includes(query.toLowerCase()) ||
            (product.prodBarcode && product.prodBarcode.includes(query))
          );
        }
        
      } catch (branchError) {
        console.warn('Branch search failed, falling back to general search');

        if (/^\d+$/.test(query)) {
          results = await productService.getByBarcode(query);
        } else {
          try {
            results = await productService.search(query);
          } catch (error) {
            const allProducts = await productService.getAll();
            results = allProducts.filter(product =>
              product.prodDescr.toLowerCase().includes(query.toLowerCase()) ||
              product.prodMarca.toLowerCase().includes(query.toLowerCase()) ||
              (product.prodBarcode && product.prodBarcode.includes(query))
            );
          }
        }
        
      }
      
      setSearchResults(results);
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    const hasStock = (product.stock_disponible || 0) > 0;
    
    if (!hasStock) {
      notifyWarning(`El producto "${product.prodDescr}" no tiene stock disponible.`);
      return;
    }
    
    onProductSelect(product);
    onSearchChange('');
    setSearchResults([]);
  };

  const isBarcodeSearch = /^\d+$/.test(searchQuery);

  // Mostrar mensaje si no hay sucursal
  if (!currentSucursal && searchQuery) {
    return (
      <div className="bg-white px-8 py-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cargando información de sucursal..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-100"
            disabled
          />
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-8 py-4 relative">
      <div className="relative">
        {isBarcodeSearch ? (
          <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-500 w-5 h-5" />
        ) : (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        )}
        
        <input
          type="text"
          placeholder={isBarcodeSearch ? "Código de barras detectado..." : "Buscar producto por nombre, marca o código..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none ${
            isBarcodeSearch 
              ? '' 
              : ''
          }`}
        />
        
        {loading && (
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        )}
      </div>

      {/* Resultados */}
      {searchQuery && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {searchResults.map((product) => (
            <ProductResultItem 
              key={product.prodCod} 
              product={product} 
              onSelect={handleProductSelect}
              isExactBarcodeMatch={isBarcodeSearch && product.prodBarcode === searchQuery}
            />
          ))}
        </div>
      )}

      {searchQuery && !loading && searchResults.length === 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 text-center text-gray-500">
          {isBarcodeSearch ? (
            <div>
              <Barcode className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No se encontró producto con código: {searchQuery}</p>
            </div>
          ) : (
            <p>No se encontraron productos para "{searchQuery}"</p>
          )}
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para mostrar cada producto (sin cambios)
const ProductResultItem: React.FC<{ 
  product: Product; 
  onSelect: (product: Product) => void;
  isExactBarcodeMatch?: boolean;
}> = ({ product, onSelect, isExactBarcodeMatch }) => {
  const hasStock = (product.stock_disponible || 0) > 0;
  
  const handleClick = () => {
        if (!hasStock) {
          notifyWarning(`El producto "${product.prodDescr}" no tiene stock disponible.`);
          return;
        }
    onSelect(product);
  };
  
  return (
    <div
  className={`p-4 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 ${
    hasStock 
      ? 'hover:bg-gray-50 bg-white' 
      : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
  }`}
  onClick={handleClick}
>
  <div className="flex items-center justify-between gap-4">
    {/* Descripción */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <h4 className={`font-semibold truncate ${hasStock ? 'text-gray-900' : 'text-gray-600'}`}>
          {product.prodDescr}
        </h4>
        {isExactBarcodeMatch && hasStock && (
          <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-200 whitespace-nowrap">
            Código exacto
          </span>
        )}
      </div>
      {product.prodBarcode && (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Barcode className="w-3.5 h-3.5" />
          <span>{product.prodBarcode}</span>
        </div>
      )}
    </div>

    {/* Marca */}
    <div className="w-32">
      <p className={`font-medium text-sm ${hasStock ? 'text-gray-700' : 'text-gray-500'}`}>
        {product.prodMarca}
      </p>
    </div>

    {/* Precio */}
    <div className="w-24 text-right">
      <p className={`font-bold text-lg ${hasStock ? 'text-blue-600' : 'text-gray-400'}`}>
        S/ {typeof product.precioVentaConIGV === 'number' ? product.precioVentaConIGV.toFixed(2) : '0.00'}
      </p>
    </div>

    {/* Stock */}
    <div className="w-20 text-right">
      {!hasStock ? (
        <span className="bg-red-50 text-red-700 text-xs px-2.5 py-1.5 rounded-full font-medium">
          Sin stock
        </span>
      ) : (
        <p className="text-sm font-medium text-gray-700">
          {product.stock_disponible || 0} und
        </p>
      )}
    </div>
  </div>
</div>
  );
};

export default ProductSearch;
