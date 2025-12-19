import { useState } from 'react';
import { User, CheckCircle, Eye, Settings } from 'lucide-react';
import type { VentaResponse } from '../../../types/sale';
import ModalDetallesVenta from './modals/ModalDetallesVenta';
import ModalGestionarVenta from './modals/ModalGestionarVenta';

interface SaleCardProps {
  venta: VentaResponse;
  onVentaActualizada?: () => void;
}

const SaleCard = ({ venta, onVentaActualizada }: SaleCardProps) => {
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [modalGestionarAbierto, setModalGestionarAbierto] = useState(false);

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

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(2);
  };

  const getStatusConfig = () => {
    const statusMap: Record<string, { color: string; text: string; animate: string }> = {
      'PENDIENTE': { 
        color: 'bg-yellow-500', 
        text: 'Pendiente',
        animate: 'animate-pulse'
      },
      'PARCIAL': { 
        color: 'bg-orange-500', 
        text: 'Pago Parcial',
        animate: 'animate-pulse'
      },
      'PAGADO': { 
        color: 'bg-green-500', 
        text: 'Pagado',
        animate: ''
      },
    };
    return statusMap[venta.ventEstado] || { color: 'bg-gray-500', text: venta.estado_display, animate: '' };
  };

  const statusConfig = getStatusConfig();

  const handleVerDetalles = () => {
    setModalDetallesAbierto(true);
  };

  const handleGestionar = () => {
    setModalGestionarAbierto(true);
  };

  const handleVentaActualizada = () => {
    if (onVentaActualizada) {
      onVentaActualizada();
    }
    setModalGestionarAbierto(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header compacto */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-gray-900 text-lg font-semibold">
                Venta: #{String(venta.ventCod).padStart(6, "0")}
              </h3>
              <p className="text-gray-500 text-sm">{formatDate(venta.ventFecha)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-900 text-xl font-bold">
                S/ {formatCurrency(venta.ventTotal)}
              </p>
              <p className="text-gray-500 text-xs">
                {venta.forma_pago_display || venta.ventFormaPago}
              </p>
            </div>
          </div>

          {/* Cliente con mejor contraste */}
          <div className="bg-gray-100 shadow-sm p-3 mb-3 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-[#3BAEDF]" />
              <span className="text-gray-900 font-medium text-sm">Cliente</span>
            </div>
            <p className="text-gray-800 truncate ml-6 uppercase">{venta.cliNombreCom}</p>
            <p className="text-gray-600 text-xs ml-6">
              {venta.cliDocTipo}: {venta.cliDocNum}
            </p>
          </div>

          {/* Estado con mejor contraste */}
          <div className="bg-gray-100 border border-gray-200 shadow-sm p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-[#3BAEDF]" />
                <span className="text-gray-900 font-medium text-sm">Estado Pago:</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${statusConfig.color} rounded-full ${statusConfig.animate}`}></div>
                <span className="text-gray-900 font-medium text-sm">
                  {statusConfig.text}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-300">
              <span className="text-gray-700 text-sm">Estado Recojo:</span>
              <span className="text-gray-900 font-medium text-sm">
                {venta.estado_recojo_display}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción prominentes */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            {/* Botón Ver Detalles */}
            <button 
              onClick={handleVerDetalles}
              className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md ring-1 ring-gray-200"
            >
              <Eye className="w-4 h-4" />
              <span>Detalles</span>
            </button>

            {/* Botón Gestionar */}
            <button 
              onClick={handleGestionar}
              className="flex-1 bg-blue-500 hover:bg-[#2A9DC9] text-white px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md"
            >
              <Settings className="w-4 h-4 text" />
              <span className='text-white'>Gestionar</span>
            </button>
          </div>
        </div>
      </div>


      <ModalDetallesVenta
        venta={venta}
        isOpen={modalDetallesAbierto}
        onClose={() => setModalDetallesAbierto(false)}
      />
      
      <ModalGestionarVenta
        venta={venta}
        isOpen={modalGestionarAbierto}
        onClose={() => setModalGestionarAbierto(false)}
        onVentaActualizada={handleVentaActualizada}
      /> 
    </>
  );
};

export default SaleCard;