import React, { useState, useEffect } from 'react';
import { User, Banknote, CreditCard, Split, Loader, Wallet, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { 
  Customer, 
  PaymentMethod, 
  CartItem, 
  TipoDocumento,
  TipoComprobante,
  TipoTarjeta
} from '../../../../types/sale';
import { getSellers } from '../../../../auth/services/userService';

import { consultarDni } from '../../../../services/reniec/reniecService';

interface TransactionPanelProps {
  cart: CartItem[];
  selectedVendor: number | null;
  onVendorChange: (vendorId: number | null) => void;
  onProcessSale: (saleData: {
    customer: Customer | null;
    paymentMethod: PaymentMethod;
    vendorId: number | null;
    tipoComprobante?: TipoComprobante;
    referenciaPago?: string;
    tipoTarjeta?: TipoTarjeta;
    adelanto?: number;
  }) => void;
  adelanto: number;
  onAdelantoChange: (monto: number) => void;
  totalVenta: number;
  saldoPendiente: number;
}

interface Vendor {
  id: number;
  name: string;
  role: string;
}

const TransactionPanel: React.FC<TransactionPanelProps> = ({
  cart,
  selectedVendor,
  onVendorChange,
  onProcessSale,
  adelanto,          
  onAdelantoChange,   
  totalVenta,        
  saldoPendiente
}) => {
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('03');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [tipoTarjeta, setTipoTarjeta] = useState<TipoTarjeta>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Cálculos de totales
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + (item.subtotal * item.discount / 100), 0);
  const igv = cart.reduce((sum, item) => sum + item.igv, 0);
  const total = cart.reduce((sum, item) => sum + item.total, 0);

  // Validar que totalVenta sea consistente
  const ventaTotal = totalVenta || total;

  const [consultandoDni, setConsultandoDni] = useState(false);
  const [dniEncontrado, setDniEncontrado] = useState(false);
  const [errorDni, setErrorDni] = useState<string | null>(null);


  // Cargar vendedores de la API
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoadingVendors(true);
        const response = await getSellers();
        
        const vendorsData: Vendor[] = response.map((user: any) => ({
          id: user.usuCod,
          name: user.usuNombreCom || user.usuNom,
          role: user.roles?.some((role: any) => role.rolNom === 'VENDEDOR') ? 'Vendedor' : 'Usuario'
        }));
        
        setVendors(vendorsData);
      } catch (error) {
        console.error('Error cargando vendedores:', error);
        setVendors([]);
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchVendors();
  }, []);

  // Resetear a Boleta cuando el cliente cambia a DNI/CE
  useEffect(() => {
    if (customer?.cliDocTipo === 'RUC') {
      setTipoComprobante('01');
    } else {
      setTipoComprobante('03');
    }
  }, [customer?.cliDocTipo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customer?.cliDocTipo === 'DNI' && customer?.cliDocNum && customer.cliDocNum.length === 8) {
        consultarDniReniec(customer.cliDocNum);
      } else {
        setDniEncontrado(false);
        setErrorDni(null);
      }
    }, 800);
  
    return () => clearTimeout(timer);
  }, [customer?.cliDocNum, customer?.cliDocTipo]);


  // Función mejorada para manejar cambios en el adelanto
  const handleAdelantoChange = (value: number) => {
    // Validar que el valor esté dentro de los límites permitidos
    const nuevoAdelanto = Math.max(0, Math.min(ventaTotal, value));
    
    // Redondear a 2 decimales
    const adelantoRedondeado = Math.round(nuevoAdelanto * 100) / 100;
    
    onAdelantoChange(adelantoRedondeado);
  };

  // Función para manejar el input de texto
  const handleAdelantoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    handleAdelantoChange(value);
  };

  // Botones de porcentaje mejorados
  const handlePercentageClick = (percentage: number) => {
    const nuevoAdelanto = ventaTotal * (percentage / 100);
    handleAdelantoChange(nuevoAdelanto);
  };

  const consultarDniReniec = async (dni: string) => {
    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
      return;
    }
  
    setConsultandoDni(true);
    setErrorDni(null);
    setDniEncontrado(false);
  
    try {
      const persona = await consultarDni(dni);
      
      updateCustomer({ 
        cliNombreCom: persona.nombreCompleto,
        cliDocNum: dni
      });
      
      setDniEncontrado(true);
      console.log('DNI encontrado:', persona);
      
    } catch (error: any) {
      setErrorDni(error.message || 'Error al consultar DNI');
      setDniEncontrado(false);
      console.error('Error al consultar DNI:', error);
    } finally {
      setConsultandoDni(false);
    }
  };

  const handleProcessSale = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!selectedVendor) {
      alert('Selecciona un vendedor');
      return;
    }

    // Validaciones adicionales según método de pago
    if (paymentMethod === 'TARJETA' && !tipoTarjeta) {
      alert('Selecciona el tipo de tarjeta');
      return;
    }

    if ((paymentMethod === 'TRANSFERENCIA' || paymentMethod === 'YAPE' || paymentMethod === 'PLIN') && !referenciaPago.trim()) {
      alert('Ingresa la referencia de pago');
      return;
    }

    if (tipoComprobante === '01' && !customer?.cliDireccion?.trim()) {
      alert('La dirección es obligatoria para emitir una Factura');
      return;
    }

    // Validar datos mínimos del cliente para Factura
    if (tipoComprobante === '01') {
      if (!customer?.cliNombreCom?.trim()) {
        alert('El nombre o razón social es obligatorio para emitir una Factura');
        return;
      }
      if (!customer?.cliDocNum?.trim()) {
        alert('El número de documento es obligatorio para emitir una Factura');
        return;
      }
    }

    if (tipoComprobante === '01' && customer?.cliDocTipo !== 'RUC') {
      if (!confirm('Las facturas normalmente se emiten con RUC. ¿Deseas continuar con ' + customer?.cliDocTipo + '?')) {
        return;
      }
    }

    // Validar que el adelanto no sea mayor al total
    if (adelanto > ventaTotal) {
      alert('El adelanto no puede ser mayor al total de la venta');
      return;
    }

    onProcessSale({
      customer,
      paymentMethod,
      vendorId: selectedVendor,
      tipoComprobante, 
      referenciaPago,  
      tipoTarjeta,
      adelanto 
    });
  };

  const updateCustomer = (updates: Partial<Customer>) => {
    setCustomer(prev => {
      if (!prev) {
        return {
          cliCod: '',
          cliNombreCom: updates.cliNombreCom || '',
          cliDocTipo: updates.cliDocTipo || 'DNI',
          cliDocNum: updates.cliDocNum || ''
        };
      }
      return { ...prev, ...updates };
    });
  };

  // Resetear campos de pago cuando cambia el método
  useEffect(() => {
    if (paymentMethod !== 'TARJETA') {
      setTipoTarjeta('');
    }
    if (!['TRANSFERENCIA', 'YAPE', 'PLIN'].includes(paymentMethod)) {
      setReferenciaPago('');
    }
  }, [paymentMethod]);

  // Determinar opciones disponibles de comprobante
  const getComprobanteOptions = () => {
    if (customer?.cliDocTipo === 'RUC') {
      return [
        { value: '01', label: 'FACTURA', description: 'Para RUC' }
      ];
    } else {
      return [
        { value: '03', label: 'BOLETA', description: 'Recomendado para DNI/CE' },
        { value: '01', label: 'FACTURA', description: 'Para DNI/CE (si el cliente solicita)' }
      ];
    }
  };

  const comprobanteOptions = getComprobanteOptions();

  return (
    <div className="w-140 bg-white border-l border-gray-200 flex flex-col">
      
      {/* Header con Vendedor */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-xl">Panel de Venta</h3>
          <div className="flex items-center space-x-2">
            {loadingVendors ? (
              <div className="flex items-center text-xs text-gray-500">
                <Loader className="w-3 h-3 animate-spin mr-1" />
                <span>Cargando...</span>
              </div>
            ) : (
            <select
              value={selectedVendor || ''}
              onChange={(e) => onVendorChange(e.target.value ? Number(e.target.value) : null)}
              className="text-sm font-semibold border-2 border-blue-600 rounded-lg px-3 py-2 
                        bg-blue-50 text-blue-700 shadow-sm hover:shadow-md 
                        focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              disabled={vendors.length === 0}
            >
              <option value="">
                <div className="flex items-center gap-1">
                  <User size={16} className="inline-block text-blue-600" />
                  VENDEDOR
                </div>
              </option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>

            )}
            
            {selectedVendor && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Vendedor seleccionado"></div>
            )}
          </div>
        </div>
        
        {vendors.length === 0 && !loadingVendors && (
          <div className="mt-2 text-xs text-red-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Sin vendedores
          </div>
        )}
      </div>

      {/* Detalles del Cliente */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowCustomerDetails(!showCustomerDetails)}
          className="flex justify-between items-center w-full p-2 rounded-lg transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-700 text-md">DATOS DEL CLIENTE</span>
            {customer?.cliNombreCom && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                ✓ Completado
              </span>
            )}
          </div>
          <span className="text-gray-500 text-sm font-medium">
            {showCustomerDetails ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>
        
        {showCustomerDetails && (
          <div className="mt-3 space-y-3 animate-fade-in">
            {/* Tipo de Comprobante */}
            <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Tipo de Comprobante
              </label>
              <div className="flex space-x-2">
                {comprobanteOptions.map((option) => (
                  <label 
                    key={option.value} 
                    className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer p-2 rounded border border-gray-300 text-sm font-medium transition ${
                      tipoComprobante === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={tipoComprobante === option.value}
                      onChange={(e) => setTipoComprobante(e.target.value as TipoComprobante)}
                      className="hidden"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nombre del Cliente */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                placeholder="Ingrese nombre del cliente"
                value={customer?.cliNombreCom || ''}
                onChange={(e) => updateCustomer({ cliNombreCom: e.target.value })}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>

            {/* Documento */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Documento de identidad
              </label>
              <div className="flex space-x-2">
                <select 
                  value={customer?.cliDocTipo || 'DNI'}
                  onChange={(e) => {
                    updateCustomer({ 
                      cliDocTipo: e.target.value as TipoDocumento,
                      cliDocNum: '',
                      cliNombreCom: ''
                    });
                    setDniEncontrado(false);
                    setErrorDni(null);
                  }}
                  className="w-1/3 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="CE">CE</option>
                </select>
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Número"
                    value={customer?.cliDocNum || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const maxLength = customer?.cliDocTipo === 'RUC' ? 11 : 8;
                      updateCustomer({ cliDocNum: value.slice(0, maxLength) });
                    }}
                    className="w-full p-2 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    maxLength={customer?.cliDocTipo === 'RUC' ? 11 : 8}
                  />
                  
                  {customer?.cliDocTipo === 'DNI' && customer?.cliDocNum && customer.cliDocNum.length === 8 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {consultandoDni && (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      )}
                      {dniEncontrado && !consultandoDni && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {errorDni && !consultandoDni && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {customer?.cliDocTipo === 'DNI' && customer?.cliDocNum && customer.cliDocNum.length === 8 && (
                <div className="mt-1">
                  {consultandoDni && (
                    <p className="text-xs text-blue-600 flex items-center">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Consultando DNI en RENIEC...
                    </p>
                  )}
                  {dniEncontrado && !consultandoDni && (
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      DNI encontrado en RENIEC
                    </p>
                  )}
                  {errorDni && !consultandoDni && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errorDni}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Dirección (obligatorio para Facturas) */}
            {(tipoComprobante === '01' || customer?.cliDocTipo === 'RUC') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Dirección <span className="text-red-500">*</span>
                  {tipoComprobante === '01' && (
                    <span className="text-xs text-gray-500 ml-1">(Requerido para Factura)</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Ingrese la dirección completa"
                  value={customer?.cliDireccion || ''}
                  onChange={(e) => updateCustomer({ cliDireccion: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
            )}

          </div>
        )}
      </div>
      
      {/* Resumen de Venta con Adelanto Mejorado */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
        <h3 className="font-bold text-gray-800 text-md mb-3">RESUMEN DE VENTA</h3>
        
        {/* Subtotal */}
        <div className="flex justify-between text-gray-600 text-sm">
          <span>Subtotal</span>
          <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
        </div>
        
        {/* Descuento */}
        {totalDiscount > 0 && (
          <div className="flex justify-between text-red-500 text-sm">
            <span>Descuento</span>
            <span className="font-medium">-S/ {totalDiscount.toFixed(2)}</span>
          </div>
        )}
        
        {/* IGV */}
        <div className="flex justify-between text-gray-600 text-sm">
          <span>IGV (18%)</span>
          <span className="font-medium">S/ {igv.toFixed(2)}</span>
        </div>
        
        {/* Línea divisora */}
        <div className="h-px bg-gray-300 my-2" />
        
        {/* Total */}
        <div className="flex justify-between text-lg font-bold text-gray-800">
          <span>TOTAL</span>
          <span>S/ {ventaTotal.toFixed(2)}</span>
        </div>

        {/* Sección de Adelanto Mejorada */}
        <div className="mt-3 pt-3 border-t border-gray-300">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Adelanto <span className="text-gray-500 font-normal">(Opcional)</span>
          </label>
          
          {/* Input de adelanto mejorado */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              S/
            </span>
            <input
              type="number"
              min="0"
              max={ventaTotal}
              step="0.01"
              value={adelanto || ''}
              onChange={handleAdelantoInputChange}
              onBlur={(e) => {
                const value = parseFloat(e.target.value) || 0;
                handleAdelantoChange(value);
              }}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white"
              placeholder="0.00"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              Max: S/ {ventaTotal.toFixed(2)}
            </div>
          </div>
          
          {/* Botones de acción rápida mejorados */}
          <div className="flex space-x-2 mb-3">
            <button
              onClick={() => handleAdelantoChange(0)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
            >
              Limpiar
            </button>
            <button
              onClick={() => handlePercentageClick(50)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
            >
              50%
            </button>
            <button
              onClick={() => handlePercentageClick(100)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
            >
              100%
            </button>
          </div>
          
          {/* Resumen de adelanto */}
          {adelanto > 0 && (
            <div className="mt-3 space-y-2 bg-gray-100 p-3 rounded-md border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Adelanto aplicado:</span>
                <span className="font-semibold text-gray-800">S/ {adelanto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Saldo pendiente:</span>
                <span className="font-semibold text-gray-800">S/ {saldoPendiente.toFixed(2)}</span>
              </div>
              {adelanto === ventaTotal && (
                <div className="flex items-center text-xs text-green-600 font-medium mt-1">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Venta pagada completamente
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* */}
      
      {/* Métodos de Pago */}
      <div className="px-4 pb-4 bg-gray-50">
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Método de Pago
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaymentMethod('EFECTIVO')}
            className={`flex items-center justify-center space-x-1 p-2 border rounded-md transition text-xs font-medium ${
              paymentMethod === 'EFECTIVO'
                ? 'bg-green-500 border-green-600 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Efectivo</span>
          </button>

          <button
            onClick={() => setPaymentMethod('TARJETA')}
            className={`flex items-center justify-center space-x-1 p-2 border rounded-md transition text-xs font-medium ${
              paymentMethod === 'TARJETA'
                ? 'bg-blue-500 border-blue-600 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Tarjeta</span>
          </button>

          <button
            onClick={() => setPaymentMethod('TRANSFERENCIA')}
            className={`flex items-center justify-center space-x-1 p-2 border rounded-md transition text-xs font-medium ${
              paymentMethod === 'TRANSFERENCIA'
                ? 'bg-purple-500 border-purple-600 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Transfer.</span>
          </button>

          <button
            onClick={() => setPaymentMethod('YAPE')}
            className={`flex items-center justify-center space-x-1 p-2 border rounded-md transition text-xs font-medium ${
              paymentMethod === 'YAPE'
                ? 'bg-indigo-500 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Yape</span>
          </button>

          <button
            onClick={() => setPaymentMethod('PLIN')}
            className={`flex items-center justify-center space-x-1 p-2 border rounded-md transition text-xs font-medium ${
              paymentMethod === 'PLIN'
                ? 'bg-violet-500 border-violet-600 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Plin</span>
          </button>

          <button
            onClick={() => setPaymentMethod('MIXTO')}
            className={`flex items-center justify-center space-x-1 p-2 border rounded-md transition text-xs font-medium ${
              paymentMethod === 'MIXTO'
                ? 'bg-gray-500 border-gray-600 text-white shadow-sm'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Split className="w-4 h-4" />
            <span>Mixto</span>
          </button>
        </div>

        {/* Campos adicionales según método de pago */}
        {paymentMethod === 'TARJETA' && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Tipo de Tarjeta
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setTipoTarjeta('DEBITO')}
                className={`flex-1 p-2 text-sm border rounded-md transition font-medium ${
                  tipoTarjeta === 'DEBITO'
                    ? 'bg-blue-500 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Débito
              </button>
              <button
                onClick={() => setTipoTarjeta('CREDITO')}
                className={`flex-1 p-2 text-sm border rounded-md transition font-medium ${
                  tipoTarjeta === 'CREDITO'
                    ? 'bg-blue-500 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Crédito
              </button>
            </div>
          </div>
        )}

        {['TRANSFERENCIA', 'YAPE', 'PLIN'].includes(paymentMethod) && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Referencia de Pago
            </label>
            <input
              type="text"
              placeholder={
                paymentMethod === 'TRANSFERENCIA' 
                  ? 'Número de operación de transferencia' 
                  : 'Número de operación'
              }
              value={referenciaPago}
              onChange={(e) => setReferenciaPago(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white"
            />
          </div>
        )}
      </div>

      {/* Botón de Procesar Venta */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleProcessSale}
          disabled={cart.length === 0 || !selectedVendor || vendors.length === 0}
          className="w-full bg-blue-500 text-white py-3 rounded-md font-semibold text-base bg-[#3BAEDF] transition flex items-center justify-center space-x-2 bg-[#3BAEDF] disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <span className='text-white'>Procesar Venta</span>
        </button>
        
        {tipoTarjeta && (
          <div className="mt-2 text-center text-xs text-gray-600">
            Tipo de tarjeta: {tipoTarjeta === 'DEBITO' ? 'Débito' : 'Crédito'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionPanel;