import { useEffect, useState } from 'react';
import { X, User, CreditCard, FileText, DollarSign, Package, Loader2, AlertCircle } from 'lucide-react';
import { saleService } from '../../../../services/saleService';
import type { VentaResponse } from '../../../../types/sale';

interface ModalDetallesVentaProps {
  venta: VentaResponse;
  isOpen: boolean;
  onClose: () => void;
}

interface VentaDetalleItem {
  ventDetCod: number;
  ventCod: number;
  prodCod: number;
  producto_nombre?: string;
  producto_marca?: string;
  producto_codigo?: string;
  ventDetCantidad: number;
  ventDetValorUni: string;
  ventDetPrecioUni: string;
  ventDetSubtotal: string;
  ventDetIGV: string;
  ventDetTotal: string;
  ventDetDescuento: string;
  ventDetAnulado: boolean;
  ventDetDescripcion?: string;
  ventDetMarca?: string;
}

const ModalDetallesVenta = ({ venta, isOpen, onClose }: ModalDetallesVentaProps) => {
  const [detalleCompleto, setDetalleCompleto] = useState<VentaResponse | null>(null);
  const [detallesProductos, setDetallesProductos] = useState<VentaDetalleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && venta.ventCod) {
      fetchDetalleCompleto();
    }
  }, [isOpen, venta.ventCod]);

  const fetchDetalleCompleto = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ventaData, detallesData] = await Promise.all([
        saleService.getVentaById(venta.ventCod),
        saleService.getVentaDetalles(venta.ventCod)
      ]);
      
      setDetalleCompleto(ventaData);
      setDetallesProductos(detallesData);
    } catch (err: any) {
      console.error('Error al cargar detalle:', err);
      setError('Error al cargar los detalles de la venta');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getEstadoPagoConfig = (estado: string) => {
    const configs: Record<string, { text: string; border: string }> = {
      'PENDIENTE': { text: 'text-amber-600', border: 'border-gray-200' },
      'PARCIAL': { text: 'text-orange-600', border: 'border-gray-200' },
      'PAGADO': { text: 'text-emerald-600', border: 'border-gray-200' },
    };
    return configs[estado] || { text: 'text-gray-600', border: 'border-gray-200' };
  };

  const getEstadoRecojoConfig = (estado: string) => {
    const configs: Record<string, { text: string; border: string }> = {
      'PENDIENTE': { text: 'text-amber-600', border: 'border-gray-200' },
      'EN_LABORATORIO': { text: 'text-cyan-600', border: 'border-gray-200' },
      'LISTO': { text: 'text-violet-600', border: 'border-gray-200' },
      'ENTREGADO': { text: 'text-emerald-600', border: 'border-gray-200' },
    };
    return configs[estado] || { text: 'text-gray-600', border: 'border-gray-200' };
  };

  if (!isOpen) return null;

  const detalle = detalleCompleto || venta;
  const estadoPagoConfig = getEstadoPagoConfig(detalle.ventEstado);
  const estadoRecojoConfig = getEstadoRecojoConfig(detalle.ventEstadoRecoj);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl w-full max-w-3xl border-2 border-gray-300">
        {/* Header */}
        <div className="bg-blue-500 text-white px-5 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Venta: #{String(venta.ventCod).padStart(6, "0")}</h2>
            <p className="text-sm opacity-90">{formatDate(detalle.ventFecha)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-600 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              <p className="text-gray-600 text-sm">Cargando detalles...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-300 rounded p-3 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-900 font-semibold text-sm">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button onClick={fetchDetalleCompleto} className="mt-1 text-red-600 underline text-xs">
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Estados con fondo gris y texto colorido */}
              <div className="grid grid-cols-2 gap-3">
                {/* Estado Pago */}
                <div className={`bg-gray-100 ${estadoPagoConfig.border} border-2 rounded-lg p-3`}>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <DollarSign className={`w-5 h-5`} />
                        <p className="text-xs font-medium text-gray-600">ESTADO PAGO</p>
                    </div>
                    <p className={`text-lg font-bold ${estadoPagoConfig.text}`}>
                        {detalle.estado_display}
                    </p>
                    </div>
                </div>

                {/* Estado Recojo */}
                <div className={`bg-gray-100 ${estadoRecojoConfig.border} border-2 rounded-lg p-3`}>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Package className={`w-5 h-5`} />
                        <p className="text-xs font-medium text-gray-600">ESTADO RECOJO</p>
                    </div>
                    <p className={`text-lg font-bold ${estadoRecojoConfig.text}`}>
                        {detalle.estado_recojo_display}
                    </p>
                    </div>
                </div>
                </div>


              {/* Cliente y Método de Pago en Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Cliente */}
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Cliente</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Nombre</p>
                      <p className="text-gray-900 font-medium uppercase">{detalle.cliNombreCom}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Documento</p>
                      <p className="text-gray-900 font-medium">{detalle.cliDocTipo}: {detalle.cliDocNum}</p>
                    </div>
                    {detalle.cliDireccion && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Dirección</p>
                        <p className="text-gray-900 font-medium">{detalle.cliDireccion}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Pago</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Forma de Pago</p>
                      <p className="text-gray-900 font-medium">{detalle.forma_pago_display}</p>
                    </div>
                    {detalle.ventTarjetaTipo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Tipo de Tarjeta</p>
                        <p className="text-gray-900 font-medium">{detalle.tarjeta_tipo_display}</p>
                      </div>
                    )}
                    {detalle.ventReferenciaPago && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Referencia</p>
                        <p className="text-gray-900 font-medium">{detalle.ventReferenciaPago}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Productos como Tabla */}
              {detallesProductos.length > 0 && (
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Package className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Productos ({detallesProductos.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-200 border-b-2 border-gray-400">
                        <tr>
                          <th className="text-left p-2 font-semibold text-gray-700">Descripcion</th>
                          <th className="text-center p-2 font-semibold text-gray-700">Cant.</th>
                          <th className="text-right p-2 font-semibold text-gray-700">P. Unit.</th>
                          <th className="text-right p-2 font-semibold text-gray-700">Marca</th>
                          <th className="text-right p-2 font-semibold text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {detallesProductos.map((item, index) => (
                          <tr key={item.ventDetCod} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="p-2 text-gray-900">
                              <div>
                                <p className="font-medium">{item.producto_nombre || item.ventDetDescripcion || `Producto #${item.prodCod}`}</p>
                                {item.producto_marca && (
                                  <p className="text-xs text-gray-500">{item.producto_marca}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-center text-gray-900 font-medium">
                              {item.ventDetCantidad}
                            </td>
                            <td className="p-2 text-right text-gray-900">
                              S/ {formatCurrency(item.ventDetValorUni)}
                            </td>
                            <td className="p-2 text-right text-gray-900">
                              {item.ventDetMarca}
                            </td>
                            <td className="p-2 text-right text-gray-900 font-bold">
                              S/ {formatCurrency(item.ventDetSubtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resumen de Montos */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Resumen de Pago</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-gray-300">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-medium">S/ {formatCurrency(detalle.ventTotalGravada)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-300">
                    <span className="text-gray-600">IGV (18%)</span>
                    <span className="text-gray-900 font-medium">S/ {formatCurrency(detalle.ventIGV)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-blue-500 text-white px-3 rounded-lg">
                    <span className="font-bold">TOTAL</span>
                    <span className="font-bold text-lg">S/ {formatCurrency(detalle.ventTotal)}</span>
                  </div>
                  {parseFloat(detalle.ventAdelanto) > 0 && (
                    <>
                      <div className="flex justify-between py-1.5 border-b border-gray-300">
                        <span className="text-gray-600">Adelanto</span>
                        <span className="text-green-600 font-medium">-S/ {formatCurrency(detalle.ventAdelanto)}</span>
                      </div>
                      <div className="flex justify-between py-2 bg-amber-100 border border-amber-400 px-3 rounded-lg">
                        <span className="text-gray-900 font-semibold">Saldo Pendiente</span>
                        <span className="text-gray-900 font-bold text-lg">S/ {formatCurrency(detalle.ventSaldo)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              {detalle.ventObservaciones && (
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Observaciones</h3>
                  </div>
                  <p className="text-sm text-gray-700">{detalle.ventObservaciones}</p>
                </div>
              )}

              {/* Venta Anulada */}
              {detalle.ventAnulada && (
                <div className="bg-red-500 border-2 border-red-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-6 h-6 text-white" />
                    <h3 className="text-sm font-bold text-white">VENTA ANULADA</h3>
                  </div>
                  <p className="text-sm text-white">
                    <span className="font-semibold">Motivo:</span> {detalle.ventMotivoAnulacion}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDetallesVenta;