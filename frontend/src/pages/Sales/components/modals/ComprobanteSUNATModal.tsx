import { useState, useRef } from 'react';
import { X, Download, Printer, Share2, Building2 } from 'lucide-react';

interface VentaDetalleItem {
  ventDetCod: number;
  ventCod: number;
  prodCod: number;
  producto_nombre?: string;
  producto_marca?: string;
  producto_codigo?: string;
  producto_unidadMed?: string;
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

interface ComprobanteSunatModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaData: any;
  sucursalData: any;
  detalleVentaData: VentaDetalleItem[];
  empresaData?: {
    razonSocial: string;
    ruc: string;
    direccion?: string;
  };
  logoUrl?: string;
}

const ComprobanteSunatModal = ({ 
  isOpen, 
  onClose, 
  ventaData, 
  sucursalData, 
  detalleVentaData,
  empresaData,
  logoUrl 
}: ComprobanteSunatModalProps) => {
  const [loading, setLoading] = useState(false);
  const comprobanteRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const formatCurrency = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') return 'S/ 0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 'S/ 0.00' : `S/ ${num.toFixed(2)}`;
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatTime = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const handlePrint = () => {
    const printContent = comprobanteRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante Electrónico</title>
          <style>
            @media print {
              @page {
                margin: 10mm;
                size: 80mm auto;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                line-height: 1.3;
                color: #000;
                background: white;
                margin: 0;
                padding: 0;
              }
              .print-container {
                width: 70mm;
                margin: 0 auto;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const element = comprobanteRef.current;
      if (!element) throw new Error('No se pudo obtener el contenido');

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: [80, (canvas.height * 80) / canvas.width]
      });
      
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`comprobante_${ventaData.comprobante?.comprobante_completo || ventaData.ventCod}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar PDF. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const numeroComprobante = ventaData.comprobante?.comprobante_completo || `B001-${String(ventaData.ventCod).padStart(8, '0')}`;
    const total = formatCurrency(ventaData.ventTotal);
    const cliente = ventaData.cliNombreCom || 'Cliente';
    
    const mensaje = `Hola ${cliente}! 👋
    
🧾 *Comprobante Electrónico*
📄 ${numeroComprobante}
💰 Total: ${total}

Gracias por su compra! 🙏`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const productosActivos = detalleVentaData.filter(item => !item.ventDetAnulado);
  
  const subtotalVenta = parseFloat(ventaData.ventSubtotal || 0);
  const igvVenta = parseFloat(ventaData.ventIGV || 0);
  const totalVenta = parseFloat(ventaData.ventTotal || 0);
  const numeroComprobante = ventaData.comprobante?.comprobante_completo || `B001-${String(ventaData.ventCod).padStart(8, '0')}`;
  const tipoComprobante = ventaData.comprobante?.tipo_display || 'BOLETA DE VENTA';

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-comprobante-container,
          .print-comprobante-container * {
            visibility: visible;
          }
          .print-comprobante-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 no-print" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div style={{ 
          backgroundColor: '#ffffff',
          maxHeight: '95vh',
          width: '500px'
        }} className="rounded-xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #fefefeff 0%, #ebebebff 100%)',
            color: '#000000ff'
          }} className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Comprobante Electrónico</h2>
            <button 
              onClick={onClose} 
              className="rounded-full p-2 transition-all hover:bg-white hover:bg-opacity-20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Botones */}
          <div style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }} className="px-6 py-3 flex justify-end space-x-2">
            <button
              onClick={handleWhatsApp}
              style={{ backgroundColor: '#25D366', border: '1px solid #128C7E' }}
              className="flex items-center space-x-2 px-3 py-2 hover:bg-opacity-90 text-white text-sm rounded-lg transition-all font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              style={{ backgroundColor: '#475569' }}
              className="flex items-center space-x-2 px-3 py-2 hover:bg-opacity-90 text-white text-sm rounded-lg transition-all font-medium"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              style={{ backgroundColor: loading ? '#94a3b8' : '#059669' }}
              className="flex items-center space-x-2 px-3 py-2 hover:bg-opacity-90 text-white text-sm rounded-lg transition-all font-medium"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Generando...' : 'Descargar'}</span>
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="overflow-y-auto flex-1 flex justify-center" style={{ backgroundColor: '#f0fdf4', padding: '20px' }}>
            {/* Comprobante Ticket Style */}
            <div 
              ref={comprobanteRef} 
              className="print-comprobante-container"
              style={{ 
                width: '80mm',
                backgroundColor: '#ffffff',
                padding: '10mm',
                fontFamily: "'Courier New', monospace",
                fontSize: '11px',
                lineHeight: '1.4',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {/* Logo y Empresa */}
              <div style={{ textAlign: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #000' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', margin: '0 auto 8px' }} />
                ) : (
                  <div style={{ 
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#f1f5f9',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px'
                  }}>
                    <Building2 style={{ width: '35px', height: '35px', color: '#94a3b8' }} />
                  </div>
                )}
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                  {empresaData?.razonSocial || 'NUESTRA EMPRESA'}
                </div>
                <div style={{ fontSize: '10px', marginBottom: '2px' }}>
                  RUC: {empresaData?.ruc || '20XXXXXXXXX'}
                </div>
                <div style={{ fontSize: '10px', marginBottom: '2px' }}>
                  {empresaData?.direccion || sucursalData.sucurDir}
                </div>
                <div style={{ fontSize: '10px', marginBottom: '2px' }}>
                  Sucursal: {sucursalData.sucurNom}
                </div>
                <div style={{ fontSize: '10px' }}>
                  Tel: {sucursalData.sucurTel}
                </div>
              </div>

              {/* Tipo de Comprobante */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '10px',
                padding: '8px',
                border: '2px solid #000',
                fontWeight: 'bold',
                fontSize: '11px',
                backgroundColor: '#f9fafb'
              }}>
                {tipoComprobante} ELECTRÓNICA
              </div>

              {/* Número de Comprobante */}
              <div style={{ 
                textAlign: 'center', 
                fontWeight: 'bold', 
                fontSize: '14px', 
                marginBottom: '10px',
                padding: '5px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #10b981'
              }}>
                {numeroComprobante}
              </div>

              {/* Fecha y Hora */}
              <div style={{ marginBottom: '10px', fontSize: '10px', backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>FECHA EMISIÓN:</span>
                  <span style={{ fontWeight: 'bold' }}>{formatDate(ventaData.ventFecha)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>HORA:</span>
                  <span style={{ fontWeight: 'bold' }}>{formatTime(ventaData.ventFecha)}</span>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #000', fontSize: '10px' }}>
                <div style={{ marginBottom: '3px', fontWeight: 'bold', fontSize: '11px' }}>
                  DATOS DEL CLIENTE
                </div>
                <div style={{ marginBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold' }}>Nombre:</span>
                </div>
                <div style={{ marginBottom: '3px', paddingLeft: '5px' }}>
                  {ventaData.cliNombreCom || 'CLIENTES VARIOS'}
                </div>
                <div>
                  <span style={{ fontWeight: 'bold' }}>{ventaData.cliDocTipo || 'DOC'}:</span> {ventaData.cliDocNum || '---------'}
                </div>
              </div>

              {/* Detalle de Productos */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '6px',
                  paddingBottom: '4px',
                  borderBottom: '2px solid #000',
                  fontSize: '11px',
                  textTransform: 'uppercase'
                }}>
                  Detalle de Productos
                </div>
                
                {productosActivos.map((detalle, index) => (
                  <div key={detalle.ventDetCod || index} style={{ 
                    marginBottom: '10px', 
                    fontSize: '10px',
                    paddingBottom: '8px',
                    borderBottom: index < productosActivos.length - 1 ? '1px dotted #ccc' : 'none'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '11px' }}>
                      {detalle.producto_nombre || detalle.ventDetDescripcion || 'Producto'}
                    </div>
                    {detalle.producto_codigo && (
                      <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>
                        Código: {detalle.producto_codigo}
                      </div>
                    )}
                    {detalle.producto_marca && (
                      <div style={{ fontSize: '9px', color: '#666', marginBottom: '3px' }}>
                        Marca: {detalle.producto_marca}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                      <span>
                        {detalle.ventDetCantidad} {detalle.producto_unidadMed || 'UND'} x {formatCurrency(detalle.ventDetPrecioUni)}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>
                        {formatCurrency(detalle.ventDetSubtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div style={{ 
                borderTop: '2px solid #000',
                borderBottom: '2px solid #000',
                paddingTop: '8px',
                paddingBottom: '8px',
                marginBottom: '10px',
                fontSize: '11px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>OP. GRAVADA:</span>
                  <span>{formatCurrency(subtotalVenta)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>IGV (18%):</span>
                  <span>{formatCurrency(igvVenta)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  paddingTop: '6px',
                  borderTop: '1px solid #000'
                }}>
                  <span>IMPORTE TOTAL:</span>
                  <span>{formatCurrency(totalVenta)}</span>
                </div>
              </div>

              {/* Forma de Pago */}
              <div style={{ marginBottom: '10px', fontSize: '10px', backgroundColor: '#f0fdf4', padding: '6px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold' }}>FORMA DE PAGO:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {ventaData.forma_pago_display || ventaData.ventFormaPago || 'CONTADO'}
                  </span>
                </div>
                {ventaData.ventReferenciaPago && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <span>Ref.:</span>
                    <span>{ventaData.ventReferenciaPago}</span>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              {ventaData.ventObservaciones && (
                <div style={{ 
                  marginBottom: '10px',
                  padding: '6px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde047',
                  fontSize: '9px',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>OBSERVACIONES:</div>
                  <div>{ventaData.ventObservaciones}</div>
                </div>
              )}

              {/* Estado SUNAT */}
              {ventaData.comprobante?.comprEstadoSUNAT === 'ACEPTADO' && (
                <div style={{ 
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: '#d1fae5',
                  border: '2px solid #10b981',
                  marginBottom: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}>
                  ✓ ACEPTADO POR SUNAT
                </div>
              )}

              {/* QR Code placeholder */}
              {ventaData.comprobante?.comprHashSUNAT && (
                <div style={{ 
                  textAlign: 'center',
                  marginBottom: '10px',
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ 
                    width: '80px',
                    height: '80px',
                    margin: '0 auto',
                    backgroundColor: '#ffffff',
                    border: '2px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: '#6b7280'
                  }}>
                    [CÓDIGO QR]
                  </div>
                  <div style={{ fontSize: '8px', marginTop: '5px', color: '#6b7280' }}>
                    Escanea para consultar
                  </div>
                </div>
              )}

              {/* Hash SUNAT */}
              {ventaData.comprobante?.comprHashSUNAT && (
                <div style={{ 
                  marginBottom: '10px',
                  fontSize: '8px',
                  color: '#666',
                  wordBreak: 'break-all',
                  backgroundColor: '#f9fafb',
                  padding: '5px',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>HASH SUNAT:</div>
                  {ventaData.comprobante.comprHashSUNAT}
                </div>
              )}

              {/* Pie */}
              <div style={{ 
                textAlign: 'center',
                paddingTop: '10px',
                borderTop: '1px dashed #000',
                fontSize: '9px'
              }}>
                <div style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '11px' }}>
                  ¡GRACIAS POR SU COMPRA!
                </div>
                <div style={{ marginBottom: '3px', fontSize: '8px', color: '#666' }}>
                  Este es un documento electrónico generado
                </div>
                <div style={{ fontSize: '8px', color: '#666', marginBottom: '5px' }}>
                  por el sistema de facturación electrónica
                </div>
                <div style={{ fontSize: '8px', color: '#666', fontWeight: 'bold' }}>
                  Representación impresa del comprobante electrónico
                </div>
                {ventaData.comprobante?.comprFechaEmision && (
                  <div style={{ fontSize: '8px', color: '#666', marginTop: '5px' }}>
                    Puede consultar el documento en www.sunat.gob.pe
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComprobanteSunatModal;