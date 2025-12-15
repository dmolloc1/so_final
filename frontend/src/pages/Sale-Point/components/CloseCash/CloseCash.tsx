import React, { useEffect, useState } from 'react';
import { Box, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AddButton from '../../../../components/Common/AddButton';
import FormInput from '../../../../components/Forms/FormInput';
import type { CashOpening } from '../../../../types/cash';
import * as cashService from '../../../../services/cashService';

interface CashSessionSales {
  total_ventas: number;
  cantidad_ventas: number;
  ventas_por_forma_pago: {
    EFECTIVO: number;
    TARJETA: number;
    TRANSFERENCIA: number;
    YAPE: number;
    PLIN: number;
    MIXTO: number;
  };
}

const CloseCashForm: React.FC = () => {
  const navigate = useNavigate();
  const { refreshOpenCash } = useOutletContext<{ refreshOpenCash: () => void }>();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [currentOpening, setCurrentOpening] = useState<CashOpening | null>(null);
  const [salesData, setSalesData] = useState<CashSessionSales | null>(null);
  const [countedAmount, setCountedAmount] = useState<number>(0);
  const [observations, setObservations] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const apertura = await cashService.getOpenCash();
        setCurrentOpening(apertura);

        // Obtener ventas de la sesión
        const ventas = await cashService.getCashSessionSales();
        setSalesData(ventas);
      } catch (err) {
        console.error('Error cargando datos', err);
        setError('No se pudieron cargar los datos de la sesión.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOpening) return;

    try {
      setLoading(true);
      await cashService.closeCashOpening({
        cajaAperMontCierre: countedAmount,
        cajaAperObservacio: observations,
      });
      
      if (refreshOpenCash) {
        await refreshOpenCash();
      }
      
      navigate('/sale-point');
    } catch (error) {
      console.error('Error al cerrar caja', error);
      setError('No se pudo cerrar la caja.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentOpening) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 text-lg font-medium">No hay caja abierta para cerrar</p>
        <button 
          onClick={() => navigate('/sale-point')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Volver
        </button>
      </div>
    );
  }

  const montoInicial = Number(currentOpening.cajaAperMontInicial ?? 0);
  const totalVentas = salesData?.total_ventas ?? 0;
  const montoEsperado = montoInicial + totalVentas;
  const diferencia = countedAmount - montoEsperado;

  return (
    <form onSubmit={handleClose} className="bg-white rounded-lg shadow-lg p-8 mt-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Box className="w-8 h-8 text-blue-600" />
        Cierre de Sesión de Caja
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Información de la sesión */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Información de la Sesión
          </h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between">
              <span className="font-medium">ID Sesión:</span>
              <span className="text-gray-900">#{currentOpening.cajAperCod}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Monto Inicial:</span>
              <span className="text-gray-900">S/ {montoInicial.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Cantidad de Ventas:</span>
              <span className="text-gray-900">{salesData?.cantidad_ventas ?? 0}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Total Ventas:</span>
              <span className="text-green-600 font-bold">S/ {totalVentas.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-bold">Monto Esperado:</span>
              <span className="text-blue-600 font-bold text-lg">S/ {montoEsperado.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Ventas por forma de pago */}
        {salesData && (
          <div className="bg-gray-200 rounded-lg p-6 border border-gray-400">
            <h3 className="text-lg font-semibold text-black-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Ventas por Forma de Pago
            </h3>
            <div className="space-y-2 text-gray-700">
              {Object.entries(salesData.ventas_por_forma_pago).map(([forma, monto]) => (
                monto > 0 && (
                  <div key={forma} className="flex justify-between py-1 border-b border-black-100">
                    <span className="font-medium">{forma}:</span>
                    <span className="text-gray-900">S/ {monto.toFixed(2)}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulario de cierre */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Registro de Cierre</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormInput
              name="countedAmount"
              type="number"
              label="Monto Contado en Caja"
              value={String(countedAmount)}
              onChange={(e) => setCountedAmount(Number(e.target.value))}
              required
              placeholder="Ej. 950.00"
            />
            
            {countedAmount > 0 && (
              <div className={`mt-3 p-3 rounded-lg border ${
                diferencia === 0 ? 'bg-green-50 border-green-200' :
                diferencia > 0 ? 'bg-blue-50 border-blue-200' :
                'bg-red-50 border-red-200'
              }`}>
                <p className="text-sm font-medium mb-1">
                  {diferencia === 0 ? '✅ Cuadra Perfecto' :
                   diferencia > 0 ? '📈 Sobrante' : ' Faltante'}
                </p>
                <p className={`text-xl font-bold ${
                  diferencia === 0 ? 'text-green-700' :
                  diferencia > 0 ? 'text-blue-700' :
                  'text-red-700'
                }`}>
                  {diferencia >= 0 ? '+' : ''}S/ {diferencia.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones del Cierre
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20"
              placeholder="Ej: Todo en orden, sin novedades..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Cancelar
        </button>
        <AddButton type="submit" disabled={loading || countedAmount === 0}>
          <Box size={16} />
          {loading ? 'Cerrando...' : 'Cerrar Caja'}
        </AddButton>
      </div>
    </form>
  );
};

export default CloseCashForm;