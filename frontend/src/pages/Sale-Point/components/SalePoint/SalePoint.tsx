import React, { useState } from 'react';
import ProductSearch from './ProductSearch';
import ProductCart from './ProductCart';
import TransactionPanel from './TransactionPanel';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle } from "lucide-react";
import type { Product } from '../../../../types/product';
import type { CartItem } from '../../../../types/sale';
import { saleService } from '../../../../services/saleService';
import { getCurrentUser } from '../../../../auth/services/userService';

const SalePoint: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const [processingSale, setProcessingSale] = useState(false);
  const [adelanto, setAdelanto] = useState<number>(0);


  // Función para calcular valores de un item del carrito
  const calculateCartItemValues = (
    product: Product,
    quantity: number,
    discount: number = 0
  ): CartItem => {
    const precioUnitarioConSinIGV = Number(product.prodValorUni);
    // Calcular subtotal sin IGV
    const subtotal = precioUnitarioConSinIGV * quantity;

    // Aplicar descuento al subtotal
    const montoDescuento = subtotal * (discount / 100);
    const subtotalConDescuento = subtotal - montoDescuento;

    // Calcular IGV según tipo de afectación SUNAT
    // '10' = Gravado (+18% IGV), '20' = Exonerado, '30' = Inafecto, '40' = Exportación
    let igv = 0;
    if (product.prodTipoAfecIGV === '10') { // Solo productos gravados
      igv = subtotalConDescuento * 0.18;
    }

    // Total final
    const total = subtotalConDescuento + igv;

    return {
      product,
      quantity,
      discount,
      subtotal,
      igv,
      total
    };
  };

  // Agregar producto al carrito o incrementar cantidad
  const handleProductSelect = (product: Product) => {
    const existingItemIndex = cart.findIndex(
      item => item.product.prodCod === product.prodCod
    );

    if (existingItemIndex >= 0) {
      // Producto ya existe, incrementar cantidad
      const existingItem = cart[existingItemIndex];
      const maxStock = product.stock_disponible || 0;

      if (existingItem.quantity >= maxStock) {
        alert(`Stock máximo alcanzado (${maxStock} unidades)`);
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = calculateCartItemValues(
        product,
        existingItem.quantity + 1,
        existingItem.discount
      );
      setCart(updatedCart);
    } else {
      // Producto nuevo
      const newItem = calculateCartItemValues(product, 1, 0);
      setCart([...cart, newItem]);
    }

    // Limpiar búsqueda
    setSearchQuery('');
  };

  // Actualizar cantidad de un producto
  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    const itemIndex = cart.findIndex(
      item => item.product.prodCod === productId
    );

    if (itemIndex < 0) return;

    const item = cart[itemIndex];
    const maxStock = item.product.stock_disponible || 0;

    // Validar límites
    if (newQuantity < 1 || newQuantity > maxStock) {
      return;
    }

    const updatedCart = [...cart];
    updatedCart[itemIndex] = calculateCartItemValues(
      item.product,
      newQuantity,
      item.discount
    );
    setCart(updatedCart);
  };

  // Actualizar descuento de un producto
  const handleUpdateDiscount = (productId: number, newDiscount: number) => {
    const itemIndex = cart.findIndex(
      item => item.product.prodCod === productId
    );

    if (itemIndex < 0) return;

    const item = cart[itemIndex];

    // Validar descuento (0-100%)
    const validDiscount = Math.max(0, Math.min(100, newDiscount));

    const updatedCart = [...cart];
    updatedCart[itemIndex] = calculateCartItemValues(
      item.product,
      item.quantity,
      validDiscount
    );
    setCart(updatedCart);
  };

  // Eliminar producto del carrito
  const handleRemoveItem = (productId: number) => {
    setCart(cart.filter(item => item.product.prodCod !== productId));
  };

  // Limpiar carrito completo
  const handleClearCart = () => {
    if (cart.length === 0) return;

    if (confirm('¿Deseas vaciar todo el carrito?')) {
      setCart([]);
      setAdelanto(0);
    }
  };

  // Manejar cambio de adelanto
  const handleAdelantoChange = (monto: number) => {
    setAdelanto(monto);
  };

  // Calcular totales : AQUI NUEVO
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = cart.reduce((sum, item) => {
      const descuento = item.subtotal * (item.discount / 100);
      return sum + descuento;
    }, 0);
    const igv = cart.reduce((sum, item) => sum + item.igv, 0);
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const saldoPendiente = total - adelanto;

    return {
      subtotal,
      totalDiscount,
      igv,
      total,
      saldoPendiente
    };
  };

  const totals = calculateTotals();

  // Procesar venta
  const handleProcessSale = async (saleData: any) => {
    try {
      setProcessingSale(true);

      // Validaciones antes de procesar
      if (adelanto < 0) {
        alert('El adelanto no puede ser negativo');
        setProcessingSale(false);
        return;
      }

      if (adelanto > totals.total) {
        alert('El adelanto no puede ser mayor al total de la venta');
        setProcessingSale(false);
        return;
      }

      // Obtener información del usuario actual
      const currentUser = await getCurrentUser();
      const sucurCod = currentUser.sucurCod || 1;

      // 1. PREPARAR DATOS PARA CREAR VENTA (sin adelanto)
      const ventaData = {
        usuCod: saleData.vendorId,
        sucurCod: sucurCod,
        cliNombreCom: saleData.customer?.cliNombreCom || 'CLIENTE GENERAL',
        cliDocTipo: saleData.customer?.cliDocTipo || 'DNI',
        cliDocNum: saleData.customer?.cliDocNum || '00000000',
        cliDireccion: saleData.customer?.cliDireccion || '',
        ventFechaEntrega: new Date().toISOString().split('T')[0],
        ventObservaciones: saleData.observaciones || '',
        ventFormaPago: saleData.paymentMethod,
        ventReferenciaPago: saleData.referenciaPago || '',
        ventTarjetaTipo: saleData.tipoTarjeta || '',

        detalles: cart.map(item => ({
          prodCod: item.product.prodCod,
          ventDetCantidad: item.quantity,
          ventDetDescuento: item.discount
        }))
      };

      console.log('Creando venta:', ventaData);

      // 2. CREAR LA VENTA
      const result = await saleService.createVenta(ventaData);
      console.log('Venta creada:', result);

      const ventaId = result.ventCod;

      // 3. REGISTRAR PAGO/ADELANTO (si hay monto)
      let pagoResult = null;
      if (adelanto > 0) {
        console.log('Registrando adelanto:', adelanto);

        const pagoData = {
          monto: adelanto,
          forma_pago: saleData.paymentMethod,
          referencia_pago: saleData.referenciaPago || '',
          tarjeta_tipo: saleData.tipoTarjeta || ''
        };

        pagoResult = await saleService.registrarPago(ventaId, pagoData);
        console.log('Adelanto registrado:', pagoResult);
      }

      // 4. MOSTRAR MENSAJE DE ÉXITO DETALLADO
      const estadoPago = adelanto >= totals.total ? 'PAGADO COMPLETO' :
        adelanto > 0 ? 'PAGO PARCIAL' : 'PENDIENTE';

      let mensajeExito =
        `¡Venta procesada exitosamente!\n\n` +
        `Venta #${ventaId}\n` +
        `Cliente: ${ventaData.cliNombreCom}\n` +
        `─────────────────────────\n` +
        `Total: S/ ${totals.total.toFixed(2)}\n` +
        `Adelanto: S/ ${adelanto.toFixed(2)}\n` +
        `Saldo: S/ ${totals.saldoPendiente.toFixed(2)}\n` +
        `─────────────────────────\n` +
        `Estado: ${estadoPago}\n` +
        `Método: ${saleData.paymentMethod}`;


      alert(mensajeExito);

      // 5. LIMPIAR CARRITO Y RESETEAR ESTADOS
      setCart([]);
      setAdelanto(0);
      setSelectedVendor(null);

    } catch (error: any) {
      console.error('Error procesando venta:', error);

      let errorMessage = 'Error desconocido. Por favor, intenta de nuevo.';

      if (error.response?.data) {
        // Intentar obtener mensaje de error del backend
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Error al procesar la venta\n\n${errorMessage}`);
    } finally {
      setProcessingSale(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Área Principal */}
      <div className="flex-1 flex flex-col pt-5 px-5">
        <header className="bg-white px-1 pt-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-start justify-between w-full">
              <div className="pr-4">
                <h1 className="text-3xl font-bold text-gray-800">Punto de Venta</h1>
                <p className="text-gray-500 mt-1">Procesa ventas rápidamente</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Indicador de items en carrito */}
                {cart.length > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div className="text-sm">
                      <span className="font-bold text-blue-900">{cart.length}</span>
                      <span className="text-blue-700 ml-1">
                        {cart.length === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botón limpiar carrito */}
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Limpiar Carrito
                  </button>
                )}

                {/* Botón cerrar caja */}
                <button
                  onClick={() => navigate("/sale-point/close-cash")}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  <LogOut size={18} />
                  Cerrar Caja
                </button>
              </div>
            </div>
          </div>

          {/* Indicador de procesamiento */}
          {processingSale && (
            <div className="mt-4 flex items-center justify-center space-x-2 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 font-medium">Procesando venta...</span>
            </div>
          )}
        </header>

        {/* Componente de Búsqueda */}
        <ProductSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onProductSelect={handleProductSelect}
        />

        {/* Componente del Carrito */}
        <ProductCart
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdateDiscount={handleUpdateDiscount}
          onRemoveItem={handleRemoveItem}
        />
      </div>

      {/* Panel de Transacción */}
      <TransactionPanel
        cart={cart}
        selectedVendor={selectedVendor}
        onVendorChange={setSelectedVendor}
        onProcessSale={handleProcessSale}
        adelanto={adelanto}
        onAdelantoChange={handleAdelantoChange}
        totalVenta={totals.total}
        saldoPendiente={totals.saldoPendiente}
      />
    </div>
  );
};

export default SalePoint;