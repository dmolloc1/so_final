import { useState, useEffect } from 'react';
import { X, Send, DollarSign, FileText, Truck, Package, CheckCircle, Trash2, Download, FileDown } from 'lucide-react';
import type { VentaResponse } from '../../../../types/sale';
import type { Branch } from '../../../../types/branch';
import { saleService } from '../../../../services/saleService';
import ComprobanteModal from './ComprobanteModal';
import ComprobanteSunatModal from './ComprobanteSUNATModal';
import * as branchService from '../../../../services/branchService';
import * as productService from '../../../../services/inventoryService';
import type { VentaDetalleItem } from '../types/venta';
import { notifyError, notifySuccess, notifyWarning } from '../../../../shared/notifications';

interface ModalGestionarVentaProps {
  venta: VentaResponse;
  isOpen: boolean;
  onClose: () => void;
  onVentaActualizada: () => void;
}

interface ComprobanteObject {
  comprCod?: number;
  comprobante_completo?: string;
  comprTipo?: string;
  tipo_display?: string;
  comprFechaEmision?: string;
  comprTotalVenta?: string;
  comprEstadoSUNAT?: string;
  estado_display?: string;
  venta_codigo?: number;
  cliente_nombre?: string;
  comprRUCEmisor?: string;
  comprNumDocReceptor?: string;
}

const ModalGestionarVenta = ({ venta, isOpen, onClose, onVentaActualizada }: ModalGestionarVentaProps) => {
  const [loading, setLoading] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [showAnularForm, setShowAnularForm] = useState(false);
  const [ventaCompleta, setVentaCompleta] = useState<VentaResponse | null>(null);
  const [sucursal, setSucursal] = useState<Branch|null>(null);
  const [detallesProductos, setDetallesProductos] = useState<VentaDetalleItem[]|null>(null);
  
  const [montoPago, setMontoPago] = useState('');
  const [formaPago, setFormaPago] = useState('EFECTIVO');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [tarjetaTipo, setTarjetaTipo] = useState('');
  
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [showComprobanteSunatModal, setShowComprobanteSunatModal] = useState(false); // ⬅️ NUEVO ESTADO

  useEffect(() => {
    if (isOpen && venta.ventCod) {
      fetchVentaCompleta();
      fetchDetalleCompleto();
    }
  }, [isOpen, venta.ventCod]);

  const fetchVentaCompleta = async () => {
    try {
      const ventaData = await saleService.getVentaById(venta.ventCod);
      setVentaCompleta(ventaData);
      const sucursalCod = ventaData.sucurCod;
      const sucursalData = await branchService.getBranch(String(sucursalCod));
      setSucursal(sucursalData);
      console.log('Datos completos de venta:', ventaData);
      console.log('Datos completos de sucursal:', sucursalData);
    } catch (error) {
      console.error('Error al cargar datos completos de venta o sucursal:', error);
      setVentaCompleta(venta);
    }
  };

  const fetchDetalleCompleto = async () => {
    try {
      setLoading(true);
      const [detallesData] = await Promise.all([
        saleService.getVentaDetalles(venta.ventCod)
      ]);
      setDetallesProductos(detallesData);
    } catch (err: any) {
      console.error('Error al cargar detalle:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;

  if (!venta || !venta.ventCod) {
    console.error('Datos de venta incompletos:', venta);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">Error: Datos de venta incompletos</p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ventaActual = ventaCompleta || venta;

  const getComprobanteText = (comprobante: any): string => {
    if (!comprobante) {
      return `Venta: #${String(ventaActual.ventCod || 0).padStart(8, '0')}`;
    }
    
    if (typeof comprobante === 'object') {
      const compObj = comprobante as ComprobanteObject;
      return compObj.comprobante_completo || 
             (compObj.comprCod ? `Comprobante: ${compObj.comprCod}` : 
             `Venta: #${String(ventaActual.ventCod || 0).padStart(8, '0')}`);
    }
    
    return comprobante.toString();
  };

  const getComprobanteId = (comprobante: any): number | null => {
    if (!comprobante) return null;
    
    if (typeof comprobante === 'object') {
      const compObj = comprobante as ComprobanteObject;
      return compObj.comprCod || null;
    }
    
    if (typeof comprobante === 'number') {
      return comprobante;
    }
    
    const num = parseInt(comprobante);
    return isNaN(num) ? null : num;
  };

  const formatCurrency = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') {
      return '0.00';
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const calcularSaldo = () => {
    if (ventaActual.ventSaldo !== undefined && ventaActual.ventSaldo !== null && ventaActual.ventSaldo !== '') {
      return ventaActual.ventSaldo;
    }
    
    console.log('Calculando saldo. Estado:', ventaActual.ventEstado, 'Total:', ventaActual.ventTotal);
    
    switch (ventaActual.ventEstado) {
      case 'PAGADO':
        return 0;
      case 'PARCIAL':
        return (parseFloat(ventaActual.ventTotal) || 0) * 0.5;
      case 'PENDIENTE':
      default:
        return ventaActual.ventTotal || 0;
    }
  };

  const saldo = calcularSaldo();
  const comprobanteId = getComprobanteId(ventaActual.comprobante);

  const handleRegistrarPago = async () => {
    if (!montoPago || parseFloat(montoPago) <= 0) {
      notifyWarning('Ingrese un monto válido');
      return;
    }
  
    setLoading(true);
    try {
      const data = await saleService.registrarPago(ventaActual.ventCod, {
        monto: parseFloat(montoPago),
        forma_pago: formaPago,
        referencia_pago: referenciaPago,
        tarjeta_tipo: tarjetaTipo,
      });
      
      notifySuccess(`Pago registrado exitosamente. Saldo actual: S/ ${data.saldo_actual}`);
      setMontoPago('');
      setReferenciaPago('');
      setShowPagoForm(false);
      await fetchVentaCompleta();
      onVentaActualizada();
    } catch (error: any) {
      console.error('Error:', error);
      notifyError(error.response?.data?.error || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarLaboratorio = async () => {
    if (!confirm('¿Está seguro de enviar esta venta al laboratorio?')) return;

    setLoading(true);
    try {
      const data = await saleService.enviarLaboratorio(ventaActual.ventCod);
      notifySuccess(data.mensaje);
      await fetchVentaCompleta();
      onVentaActualizada();
    } catch (error: any) {
      console.error('Error:', error);
      notifyError(error.response?.data?.error || 'Error al enviar al laboratorio');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarListo = async () => {
    if (!confirm('¿Marcar esta venta como lista para recoger?')) return;
  
    setLoading(true);
    try {
      const data = await saleService.marcarListo(ventaActual.ventCod);
      notifySuccess(data.mensaje);
      await fetchVentaCompleta();
      onVentaActualizada();
    } catch (error: any) {
      console.error('Error:', error);
      notifyError(error.response?.data?.error || 'Error al marcar como listo');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarEntregado = async () => {
    if (!confirm('¿Marcar esta venta como entregada?')) return;
  
    setLoading(true);
    try {
      const data = await saleService.marcarEntregado(ventaActual.ventCod);
      notifySuccess(data.mensaje);
      await fetchVentaCompleta();
      onVentaActualizada();
    } catch (error: any) {
      console.error('Error:', error);
      notifyError(error.response?.data?.error || 'Error al marcar como entregado');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarSunat = async () => {
    if (!confirm('¿Enviar comprobante a SUNAT?')) return;
  
    setLoading(true);
    try {
      let comprobanteData = null;
      
      if (comprobanteId) {
        comprobanteData = { comprCod: comprobanteId };
      } else {
        comprobanteData = await saleService.getComprobanteByVentaId(ventaActual.ventCod);
        
        if (!comprobanteData) {
          throw new Error('No se encontró comprobante para esta venta. La venta debe estar completamente pagada para generar comprobante.');
        }
      }
  
      const data = await saleService.enviarASunat(comprobanteData.comprCod);
      
      notifySuccess(data.mensaje || 'Comprobante enviado a SUNAT exitosamente');
      
      await fetchVentaCompleta();
      onVentaActualizada();
      
    } catch (error: any) {
      console.error('Error enviando a SUNAT:', error);
      
      if (error.message?.includes('No se encontró comprobante')) {
        notifyError(error.message);
      } else if (error.response?.data?.error) {
        notifyError(`Error: ${error.response.data.error}`);
      } else {
        notifyError('Error al enviar a SUNAT: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnularVenta = async () => {
    if (!motivoAnulacion.trim()) {
      notifyWarning('Ingrese el motivo de anulación');
      return;
    }
  
    if (!confirm('¿Está seguro de anular esta venta? Esta acción es irreversible.')) return;
  
    setLoading(true);
    try {
      const data = await saleService.anularVenta(ventaActual.ventCod, {
        motivo: motivoAnulacion,
      });
      notifySuccess(data.mensaje);
      onVentaActualizada();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      notifyError(error.response?.data?.error || 'Error al anular la venta');
    } finally {
      setLoading(false);
    }
  };

  const descargarArchivo = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDescargarPDF = async () => {
    if (!comprobanteId) {
      notifyWarning('No hay comprobante disponible');
      return;
    }
  
    setLoading(true);
    try {
      const blob = await saleService.descargarPDF(comprobanteId);
      const ventaActual = ventaCompleta || venta;
      const filename = `comprobante_${ventaActual.comprobante?.comprobante_completo || ventaActual.ventCod}.pdf`;
      
      descargarArchivo(blob, filename);
    } catch (error: any) {
      console.error('Error descargando PDF:', error);
      notifyError(error.response?.data?.error || 'Error al descargar PDF');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDescargarXML = async () => {
    if (!comprobanteId) {
      notifyWarning('No hay comprobante disponible');
      return;
    }
  
    setLoading(true);
    try {
      const blob = await saleService.descargarXML(comprobanteId);
      const ventaActual = ventaCompleta || venta;
      const filename = `comprobante_${ventaActual.comprobante?.comprobante_completo || ventaActual.ventCod}.xml`;
      
      descargarArchivo(blob, filename);
    } catch (error: any) {
      console.error('Error descargando XML:', error);
      notifyError(error.response?.data?.error || 'Error al descargar XML');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDescargarCDR = async () => {
    if (!comprobanteId) {
      notifyWarning('No hay comprobante disponible');
      return;
    }
  
    setLoading(true);
    try {
      const blob = await saleService.descargarCDR(comprobanteId);
      const ventaActual = ventaCompleta || venta;
      const filename = `CDR_${ventaActual.comprobante?.comprobante_completo || ventaActual.ventCod}.zip`;
      
      descargarArchivo(blob, filename);
    } catch (error: any) {
      console.error('Error descargando CDR:', error);
      notifyError(error.response?.data?.error || 'Error al descargar CDR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[85vh] pointer-events-auto border-2 border-gray-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Gestionar Boleta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-60px)]">
          {/* Información de la venta */}
          <div className="bg-gray-50 border border-gray-200 px-4 pt-2 rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {getComprobanteText(ventaActual)}
                  <span className={` mx-4 px-2 inline-block  rounded-full text-xs font-medium ${
                    ventaActual.ventEstado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                    ventaActual.ventEstado === 'PARCIAL' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ventaActual.estado_display || ventaActual.ventEstado || 'Pendiente'}
                  </span>
                </h3>
                <p className="text-sm text-gray-600 uppercase">{ventaActual.cliNombreCom || 'Sin nombre'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">S/ {formatCurrency(ventaActual.ventTotal)}</p>
                <p className="text-sm text-gray-600 mb-1">Saldo: S/ {formatCurrency(saldo)}</p>
              </div>
            </div>
          </div>

          {/* SECCIÓN SUNAT */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">SUNAT</h3>
            
            <button
              onClick={handleEnviarSunat}
              disabled={loading || ventaActual.ventAnulada || ventaActual.ventEstado !== 'PAGADO'}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white px-4 py-3 rounded font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <Send className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">
                    {loading ? 'Enviando a SUNAT...' : 'Enviar a SUNAT'}
                  </div>
                  <div className="text-xs opacity-90">
                    {ventaActual.ventEstado !== 'PAGADO' 
                      ? 'Venta debe estar pagada' 
                      : comprobanteId ? 'Transmitir comprobante' : 'Buscar y transmitir'
                    }
                  </div>
                </div>
              </div>
            </button>

            {comprobanteId && (
              <div className="flex space-x-2">
                <button
                  onClick={handleDescargarPDF}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{loading ? '...' : 'PDF'}</span>
                </button>
                <button
                  onClick={handleDescargarXML}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{loading ? '...' : 'XML'}</span>
                </button>
                <button
                  onClick={handleDescargarCDR}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{loading ? '...' : 'CDR'}</span>
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN PAGOS */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">PAGOS</h3>
            
            {!showPagoForm ? (
              <button
                onClick={() => setShowPagoForm(true)}
                disabled={loading || ventaActual.ventEstado === 'PAGADO' || ventaActual.ventAnulada}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded font-medium transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Registrar Pago</div>
                    <div className="text-xs opacity-90">Pendiente: S/ {formatCurrency(saldo)}</div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 p-4 rounded space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-green-900">Registrar Pago</h4>
                  <button
                    onClick={() => setShowPagoForm(false)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto (Saldo: S/ {formatCurrency(saldo)})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    max={parseFloat(saldo.toString())}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pago
                  </label>
                  <select
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="YAPE">Yape</option>
                    <option value="PLIN">Plin</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>

                {(formaPago === 'YAPE' || formaPago === 'PLIN' || formaPago === 'TRANSFERENCIA') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referencia/Operación
                    </label>
                    <input
                      type="text"
                      value={referenciaPago}
                      onChange={(e) => setReferenciaPago(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Número de operación"
                    />
                  </div>
                )}

                {formaPago === 'TARJETA' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Tarjeta
                    </label>
                    <select
                      value={tarjetaTipo}
                      onChange={(e) => setTarjetaTipo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccione...</option>
                      <option value="VISA">Visa</option>
                      <option value="MASTERCARD">Mastercard</option>
                      <option value="AMEX">American Express</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={handleRegistrarPago}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  {loading ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            )}

            {/* ⬇️⬇️⬇️ BOTONES DE COMPROBANTES ACTUALIZADOS ⬇️⬇️⬇️ */}
            <button
              onClick={() => setShowComprobanteModal(true)}
              disabled={ventaActual.ventAnulada}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Comprobante de Adelanto</div>
                  <div className="text-xs opacity-90">Imprimir o descargar</div>
                </div>
              </div>
            </button>

            {/* ⬇️⬇️⬇️ NUEVO BOTÓN PARA COMPROBANTE SUNAT ⬇️⬇️⬇️ */}
            <button
              onClick={() => setShowComprobanteSunatModal(true)}
              disabled={ventaActual.ventAnulada || !comprobanteId}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Boleta Electrónica</div>
                  <div className="text-xs opacity-90">Imprimir, descargar o enviar</div>
                </div>
              </div>
            </button>
            {/* ⬆️⬆️⬆️ FIN NUEVO BOTÓN ⬆️⬆️⬆️ */}

            {/* Modales */}
            <ComprobanteModal
              isOpen={showComprobanteModal}
              onClose={() => setShowComprobanteModal(false)}
              ventaData={ventaActual}
              saleService={saleService}
              sucursalData={sucursal}
              detalleVentaData={detallesProductos}
            />

            {/* ⬇️⬇️⬇️ NUEVO MODAL SUNAT ⬇️⬇️⬇️ */}
            <ComprobanteSunatModal
              isOpen={showComprobanteSunatModal}
              onClose={() => setShowComprobanteSunatModal(false)}
              ventaData={ventaActual}
              sucursalData={sucursal}
              detalleVentaData={detallesProductos || []}
              empresaData={{
                razonSocial: "MI EMPRESA S.A.C.",
                ruc: "20123456789",
                direccion: sucursal?.sucurDir || "Dirección Principal"
              }}
              logoUrl={undefined} // Puedes pasar la URL de tu logo aquí
            />
            {/* ⬆️⬆️⬆️ FIN NUEVO MODAL ⬆️⬆️⬆️ */}
          </div>

          {/* SECCIÓN GESTIÓN */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">GESTIÓN</h3>
            
            <button
              onClick={handleEnviarLaboratorio}
              disabled={loading || ventaActual.ventEstadoRecoj !== 'PENDIENTE' || ventaActual.ventAnulada}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-3 rounded font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Enviar a Laboratorio</div>
                  <div className="text-xs opacity-90">Estado: {ventaActual.estado_recojo_display}</div>
                </div>
              </div>
            </button>
            <button
              onClick={handleMarcarListo}
              disabled={loading || ventaActual.ventEstadoRecoj !== 'LABORATORIO' || ventaActual.ventAnulada}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-4 py-3 rounded font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Marcar Listo</div>
                  <div className="text-xs opacity-90">Listo para recoger</div>
                </div>
              </div>
            </button>

            <button
              onClick={handleMarcarEntregado}
              disabled={loading || ventaActual.ventEstadoRecoj !== 'LISTO' || ventaActual.ventAnulada}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white px-4 py-3 rounded font-medium transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Marcar Entregado</div>
                  <div className="text-xs opacity-90">Completar entrega</div>
                </div>
              </div>
            </button>

            {/* Botón Anular */}
            {!showAnularForm ? (
              <button
                onClick={() => setShowAnularForm(true)}
                disabled={loading || ventaActual.ventAnulada}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-4 py-3 rounded font-medium transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Eliminar Boleta</div>
                    <div className="text-xs opacity-90">Acción irreversible</div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-red-900">Anular Venta</h4>
                  <button
                    onClick={() => setShowAnularForm(false)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de Anulación *
                  </label>
                  <textarea
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Escriba el motivo..."
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleAnularVenta}
                  disabled={loading || !motivoAnulacion.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  {loading ? 'Procesando...' : 'Confirmar Anulación'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalGestionarVenta;
