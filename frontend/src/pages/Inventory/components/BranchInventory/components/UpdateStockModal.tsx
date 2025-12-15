import type { Inventory as InventoryType } from '../../../../../types/product';
import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../../../../services/inventoryService';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../../../../components/Modal/modal';
import FormInput from '../../../../../components/Forms/FormInput';
import AddButton from '../../../../../components/Common/AddButton';

interface UpdateStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: InventoryType | null;
  onUpdate: () => void;
}

const UpdateStockModal: React.FC<UpdateStockModalProps> = ({ 
  isOpen, 
  onClose, 
  inventoryItem, 
  onUpdate 
}) => {
  const [newStock, setNewStock] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (inventoryItem) {
      setNewStock(inventoryItem.invStock);
    }
    setError('');
  }, [inventoryItem, isOpen]);

  const handleUpdate = async () => {
    if (!inventoryItem) return;

    setLoading(true);
    setError('');

    try {
      await inventoryService.updateStock(inventoryItem.id, newStock);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el stock');
    } finally {
      setLoading(false);
    }
  };

  if (!inventoryItem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Actualizar Stock"
      size="sm"
    >
      <div>
        <p className="text-sm text-gray-600 mb-4">{inventoryItem.producto_descripcion}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Actual
          </label>
          <p className="text-3xl font-bold text-gray-800">{inventoryItem.invStock}</p>
        </div>

        <FormInput
          label="Nuevo Stock"
          type="number"
          name="newStock"
          value={newStock.toString()}
          onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
          required
          placeholder="0"
        />

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <AlertTriangle className="w-4 h-4" />
          <span>Stock mínimo: {inventoryItem.invStockMin}</span>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <AddButton onClick={handleUpdate} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar Stock'}
          </AddButton>
        </div>
      </div>
    </Modal>
  );
};

export default UpdateStockModal;