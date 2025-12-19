// TestInventory.tsx
import React, { useState, useEffect } from 'react';
import api from '../auth/services/api';

interface InventoryItem {
  id: number;
  prodCod: number;
  sucurCod: number;
  invStock: number;
  invStockMin: number;
  producto_descripcion: string;
  producto_marca: string;
  sucursal_nombre: string;
}

const TestInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Obtener usuario actual
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/user/current-user/');
      setCurrentUser(response.data);
      console.log('Usuario actual:', response.data);
    } catch (err) {
      console.error('Error al obtener usuario:', err);
    }
  };

  // Obtener inventario (ya filtrado por sucursal en backend)
  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<InventoryItem[]>('inventory/inventory');
      setInventory(response.data);
      console.log('Inventario obtenido:', response.data);
    } catch (err: any) {
      console.error('Error al cargar inventario:', err);
      setError(err.response?.data?.detail || 'Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchInventory();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de Inventario por Sucursal</h1>

      {/* Info del usuario */}
      {currentUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">Usuario Actual:</h2>
          <p className="text-sm text-blue-800">
            <strong>Nombre:</strong> {currentUser.usuNombreCom}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Usuario:</strong> {currentUser.usuNom}
          </p>
          {currentUser.sucursal ? (
            <p className="text-sm text-blue-800">
              <strong>Sucursal:</strong> {currentUser.sucursal.sucurNom} (ID: {currentUser.sucursal.sucurCod})
            </p>
          ) : (
            <p className="text-sm text-red-600">
              ⚠️ Usuario sin sucursal asignada
            </p>
          )}
        </div>
      )}

      {/* Botón recargar */}
      <button
        onClick={fetchInventory}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Cargando...' : 'Recargar Inventario'}
      </button>

      {/* Errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabla de inventario */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Cargando inventario...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Marca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sucursal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Mín
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No hay inventario disponible para tu sucursal
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.producto_descripcion}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.producto_marca}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {item.sucursal_nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-semibold ${
                            item.invStock <= item.invStockMin
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {item.invStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.invStockMin}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Total de productos:</strong> {inventory.length}
            </p>
            {currentUser?.sucursal && (
              <p className="text-green-600 mt-2">
                ✅ Mostrando solo productos de: <strong>{currentUser.sucursal.sucurNom}</strong>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TestInventory;