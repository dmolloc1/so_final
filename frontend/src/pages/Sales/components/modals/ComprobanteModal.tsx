import { useState, useRef, useEffect } from 'react';
import { X, Download, Printer, CheckCircle, Building2 } from 'lucide-react';
import { notifyError, notifyWarning } from '../../../../shared/notifications';

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

interface ComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaData: any;
  saleService?: any;
  sucursalData: any;
  detalleVentaData: VentaDetalleItem[];
  logoUrl?: string; // URL del logo de la empresa
}

const ComprobanteModal = ({ 
  isOpen, 
  onClose, 
  ventaData, 
  saleService, 
  sucursalData, 
  detalleVentaData,
  logoUrl 
}: ComprobanteModalProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const comprobanteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && ventaData?.ventCod && saleService) {
      // fetchDetalles si es necesario
    }
  }, [isOpen, ventaData?.ventCod]);

  if (!isOpen) return null;

  if (!ventaData || !ventaData.ventCod) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div style={{ backgroundColor: '#ffffff' }} className="rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <p style={{ color: '#dc2626' }} className="font-semibold mb-4">Error: Datos de venta incompletos</p>
            <button onClick={onClose} style={{ backgroundColor: '#6b7280' }} className="hover:opacity-90 text-white px-4 py-2 rounded">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') return 'S/ 0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 'S/ 0.00' : `S/ ${num.toFixed(2)}`;
  };

  const formatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const handlePrint = () => {
    const printContent = comprobanteRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      notifyWarning('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante de Adelanto</title>
          <style>
            @media print {
              @page {
                margin: 15mm;
                size: A4;
              }
              body {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 11px;
                line-height: 1.4;
                color: #000;
                background: white;
              }
              .print-container {
                max-width: 100%;
              }
              .no-print {
                display: none !important;
              }
              .print-break {
                page-break-inside: avoid;
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
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4' 
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`comprobante_adelanto_${ventaData.ventCod}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      notifyError('Error al generar PDF. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const numeroComprobante = ventaData.comprobante?.comprobante_completo || 
                          `CA${String(ventaData.ventCod).padStart(6, '0')}`;
  const montoPagado = ventaData.ventAdelanto ? parseFloat(ventaData.ventAdelanto) : 0;
  const totalVenta = parseFloat(ventaData.ventTotal || 0);
  const saldoPendiente = parseFloat(ventaData.ventSaldo || 0);

  // Filtrar productos no anulados
  const productosActivos = detalleVentaData.filter(item => !item.ventDetAnulado);

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            margin: 0;
            padding: 0;
          }
          .print-modal-container,
          .print-modal-container * {
            visibility: visible;
          }
          .print-modal-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
            box-shadow: none;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .print-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Modal principal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 no-print" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div style={{ 
          backgroundColor: '#ffffff',
          maxHeight: '95vh'
        }} className="rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Comprobante de Adelanto</h2>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-full p-2 transition-all hover:bg-white hover:bg-opacity-20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Botones */}
          <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} className="px-6 py-3 flex justify-end space-x-3">
            <button
              onClick={handlePrint}
              style={{ backgroundColor: '#475569', border: '1px solid #334155' }}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-opacity-90 text-white text-sm rounded-lg transition-all font-medium"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              style={{ 
                backgroundColor: loading ? '#94a3b8' : '#3b82f6',
                border: loading ? '1px solid #64748b' : '1px solid #2563eb'
              }}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-opacity-90 text-white text-sm rounded-lg transition-all font-medium"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Generando...' : 'Descargar PDF'}</span>
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="overflow-y-auto flex-1">
            {/* Contenido para imprimir */}
            <div className="print-modal-container p-8" ref={comprobanteRef} style={{ backgroundColor: '#ffffff' }}>
              
              {/* Encabezado con Logo */}
              <div style={{ borderBottom: '3px solid #e2e8f0' }} className="mb-6 pb-6 print-break">
                <div className="flex items-start justify-between">
                  {/* Logo y datos empresa */}
                  <div className="flex items-start space-x-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
                    ) : (
                      <div style={{ 
                        backgroundColor: '#f1f5f9',
                        border: '2px dashed #cbd5e1'
                      }} className="w-20 h-20 rounded-lg flex items-center justify-center">
                        <Building2 className="w-10 h-10" style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                    <div>
                      <h1 style={{ color: '#1e293b' }} className="text-2xl font-bold mb-1">NUESTRA EMPRESA</h1>
                      <p style={{ color: '#64748b' }} className="text-sm mb-1">RUC: 20XXXXXXXXX</p>
                      <p style={{ color: '#64748b' }} className="text-sm">{sucursalData.sucurDir}</p>
                      <p style={{ color: '#64748b' }} className="text-sm">Tel: {sucursalData.sucurTel}</p>
                    </div>
                  </div>

                  {/* Comprobante Box */}
                  <div style={{ 
                    border: '2px solid #667eea',
                    backgroundColor: '#f8fafc'
                  }} className="px-4 py-3 rounded-lg text-center min-w-[200px]">
                    <p style={{ color: '#64748b' }} className="text-xs font-medium mb-1">COMPROBANTE DE ADELANTO</p>
                    <p style={{ color: '#667eea' }} className="text-xl font-bold">{numeroComprobante}</p>
                    <p style={{ color: '#64748b' }} className="text-xs mt-1">Sucursal: {sucursalData.sucurNom}</p>
                  </div>
                </div>
              </div>

              {/* Info Cliente y Fecha */}
              <div style={{ 
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }} className="p-4 mb-6 print-break">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p style={{ color: '#64748b' }} className="text-xs font-semibold uppercase mb-2">Cliente</p>
                    <p className="font-bold text-base" style={{ color: '#1e293b' }}>{ventaData.cliNombreCom || 'Clientes - Varios'}</p>
                    <p style={{ color: '#475569' }} className="text-sm mt-1">
                      {ventaData.cliDocTipo || 'DOC'}: {ventaData.cliDocNum || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: '#64748b' }} className="text-xs font-semibold uppercase mb-2">Fecha de Emisión</p>
                    <p className="font-bold text-base" style={{ color: '#1e293b' }}>{formatDateTime(ventaData.ventFecha)}</p>
                  </div>
                </div>
              </div>

              {/* Productos */}
              {!loadingDetalles && productosActivos.length > 0 && (
                <div className="mb-6 print-break">
                  <h3 style={{ 
                    color: '#1e293b',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '8px'
                  }} className="font-bold text-sm uppercase mb-3">Detalle de Productos</h3>
                  
                  <div style={{ 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                          <th style={{ 
                            textAlign: 'left', 
                            padding: '12px',
                            color: '#475569',
                            fontWeight: '600',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}>Descripción</th>
                          <th style={{ 
                            textAlign: 'center', 
                            padding: '12px',
                            width: '100px',
                            color: '#475569',
                            fontWeight: '600',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}>Cantidad</th>
                          <th style={{ 
                            textAlign: 'right', 
                            padding: '12px',
                            width: '110px',
                            color: '#475569',
                            fontWeight: '600',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}>P. Unitario</th>
                          <th style={{ 
                            textAlign: 'right', 
                            padding: '12px',
                            width: '110px',
                            color: '#475569',
                            fontWeight: '600',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productosActivos.map((detalle, index) => (
                          <tr key={detalle.ventDetCod || index} style={{ 
                            borderTop: '1px solid #e2e8f0',
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}>
                            <td style={{ padding: '12px' }}>
                              <div>
                                <p style={{ color: '#1e293b', fontWeight: '500' }}>
                                  {detalle.producto_nombre || detalle.ventDetDescripcion || 'Sin nombre'}
                                </p>
                                {detalle.producto_marca && (
                                  <p style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                                    Marca: {detalle.producto_marca}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', padding: '12px', color: '#475569', fontWeight: '500' }}>
                              {detalle.ventDetCantidad || 0} <span style={{ color: '#64748b', fontSize: '11px' }}>{detalle.producto_unidadMed || ''}</span>
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px', color: '#475569' }}>
                              {formatCurrency(detalle.ventDetPrecioUni || 0)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px', color: '#1e293b', fontWeight: '600' }}>
                              {formatCurrency(detalle.ventDetSubtotal || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resumen de Pago */}
              <div style={{ 
                border: '2px solid #cbd5e1',
                borderRadius: '12px',
                overflow: 'hidden'
              }} className="mb-6 print-break">
                <div style={{ 
                  background: 'linear-gradient(135deg, #6d92acff 0%, #5fbf89ff 100%)',
                  color: '#ffffff',
                  padding: '12px'
                }} className="text-center">
                  <h3 className="font-bold text-base uppercase">Resumen de Pago</h3>
                </div>
                
                <div style={{ backgroundColor: '#ffffff' }} className="p-5">
                  <div className="space-y-3">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      paddingBottom: '12px',
                      borderBottom: '2px solid #e2e8f0'
                    }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Total de la Venta:</span>
                      <span style={{ color: '#1e293b', fontSize: '18px' }} className="font-bold">{formatCurrency(totalVenta)}</span>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '8px'
                    }}>
                      <div className="flex items-center space-x-2">
                        <CheckCircle style={{ color: '#ffffff' }} className="w-6 h-6" />
                        <span style={{ color: '#ffffff' }} className="font-semibold">Adelanto Recibido:</span>
                      </div>
                      <span style={{ color: '#ffffff', fontSize: '22px' }} className="font-bold">{formatCurrency(montoPagado)}</span>
                    </div>

                    <div style={{ 
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '10px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '6px'
                      }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Forma de Pago:</span>
                        <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '13px' }}>
                          {ventaData.forma_pago_display || ventaData.ventFormaPago || 'No especificado'}
                        </span>
                      </div>
                      {ventaData.ventReferenciaPago && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: '#64748b', fontSize: '13px' }}>Referencia:</span>
                          <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '13px' }}>{ventaData.ventReferenciaPago}</span>
                        </div>
                      )}
                    </div>

                    {saldoPendiente > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: '#78350f', fontWeight: '600' }}>Saldo Pendiente:</span>
                        <span style={{ color: '#78350f', fontSize: '22px' }} className="font-bold">{formatCurrency(saldoPendiente)}</span>
                      </div>
                    )}

                    {saldoPendiente === 0 && montoPagado > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #86efac 0%, #4ade80 100%)',
                        borderRadius: '8px'
                      }} className="space-x-2">
                        <CheckCircle style={{ color: '#14532d' }} className="w-6 h-6" />
                        <span style={{ color: '#14532d', fontSize: '16px' }} className="font-bold">¡PAGO COMPLETADO!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {ventaData.ventObservaciones && (
                <div style={{ 
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  padding: '12px'
                }} className="mb-6 print-break">
                  <p style={{ color: '#92400e', fontWeight: '600', marginBottom: '6px' }} className="text-sm">📝 Observaciones:</p>
                  <p style={{ color: '#78350f' }} className="text-sm">
                    {ventaData.ventObservaciones}
                  </p>
                </div>
              )}

              {/* Pie de página */}
              <div style={{ 
                borderTop: '2px solid #e2e8f0',
                paddingTop: '16px',
                textAlign: 'center'
              }} className="print-break">
                <p style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px' }} className="text-base">
                  ¡Gracias por su confianza!
                </p>
                <p style={{ color: '#64748b' }} className="text-sm mb-2">
                  Este documento es válido como comprobante de pago adelantado
                </p>
                {ventaData.comprobante?.comprEstadoSUNAT === 'ACEPTADO' && (
                  <div style={{ 
                    display: 'inline-block',
                    backgroundColor: '#d1fae5',
                    border: '1px solid #6ee7b7',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    marginTop: '8px'
                  }}>
                    <p style={{ color: '#065f46', fontWeight: '600', fontSize: '13px' }}>
                      ✓ Aceptado por SUNAT
                    </p>
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

export default ComprobanteModal;
