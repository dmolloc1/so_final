import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import DataTable, { type Column } from '../../../../components/Table/DataTable';
import CashForm from './CashForm';
import { getCashes, createCash, updateCash, deleteCash } from '../../../../services/cashService';
import type { Cash } from '../../../../types/cash';
import DeleteConfirmCash from './DeleteConfirmCash';

// Componentes Commons
import AddButton from '../../../../components/Common/AddButton';
import SearchInput from '../../../../components/Common/SearchInput';
import RemoveButton from '../../../../components/Common/RemoveButton';
import ReloadButton from '../../../../components/Common/ReloadButton';

const Cajas: React.FC = () => {
  const [cashes, setCashes] = useState<Cash[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCaja, setSelectedCaja] = useState<Cash | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
//Para borrar
  const [pendingDeleteId,setPendingDeleteId] = useState<number|null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    fetchCajas();
  }, []);

  // Función para cargar cajas desde el backend
  const fetchCajas = async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching cashes...');
      const data = await getCashes();
      console.log('Cashes loaded:', data);
      setCashes(data);
      setTotalCount(data.length);
    } catch (err: any) {
      console.error('Error loading cashes:', err);
      setError('Error al cargar las cajas. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const normalizeText = (text: string) => text.normalize('NFD').toLowerCase();

  // Filtrar cajas según el término de búsqueda (según nombre o descripción)
  const cashFilter = cashes.filter(cash =>
    normalizeText(cash.cajNom).includes(normalizeText(searchTerm)) ||
    normalizeText(cash.cajDes).includes(normalizeText(searchTerm))
  );

  // Abrir modal para crear
  const handleCreate = () => {
    setModalMode('create');
    setSelectedCaja(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (caja: Cash) => {
    setModalMode('edit');
    setSelectedCaja(caja);
    setIsModalOpen(true);
  };

  // Eliminar caja lo utilizaremos luego del confirm de deleteConfirmCash
  const deleteCashBottom = async (cash: Cash) => {
    setConfirmDeleteOpen(true);
    setPendingDeleteId(cash.cajCod);
  };

  const handleDelete = async (cash: Cash) => {
    try {
      await deleteCash(cash.cajCod);
      await fetchCajas(searchTerm);
      setTotalCount((c) => Math.max(0, c - 1));
      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
      console.log('Caja eliminada exitosamente');
    } catch (err: any) {
      console.error('Error al eliminar:', err);

    }
  
  };

  // Guardar caja
  const handleSubmit = async (cash: Cash) => {
    try {
      if (modalMode === 'create') {
        await createCash(cash);
        console.log('Caja creada exitosamente');
      } else {
        await updateCash(cash.cajCod!, cash);
        console.log('Caja actualizada exitosamente');
      }
      await fetchCajas(searchTerm);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error al guardar:', err);
      throw err;
    }
  };

  // Función para obtener el badge de estado
  const getEstadoBadge = (estado: Cash['cajEstado']) => {
    const styles = {
      ACTIVO: 'bg-green-100 text-green-800',
      DESACTIVADO: 'bg-red-100 text-red-800',
      SUSPENDIDO: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      ACTIVO: 'Activo',
      DESACTIVADO: 'Desactivado',
      SUSPENDIDO: 'Suspendido'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[estado]}`}>
        {labels[estado]}
      </span>
    );
  };

  // Definir las columnas de la tabla
  const columns: Column<Cash>[] = [
    {
      key: 'cajCod',
      label: 'CÓDIGO',
      render: (row) => (
        <span className="text-gray-900 font-medium">{row.cajCod}</span>
      )
    },
    {
      key: 'cajNom',
      label: 'NOMBRE',
      render: (row) => (
        <span className="text-gray-900 font-semibold">{row.cajNom}</span>
      )
    },
    {
      key: 'cajDes',
      label: 'DESCRIPCIÓN',
      render: (row) => (
        <span className="text-gray-600">{row.cajDes}</span>
      )
    },
    {
      key: 'sucurCod',
      label: 'SUCURSAL',
      render: (row) => (
        <span className="text-gray-600">Sucursal {row.sucurCod}</span>
      )
    },
    {
      key: 'cajEstado',
      label: 'ESTADO',
      render: (row) => getEstadoBadge(row.cajEstado)
    },
    {
      key: 'acciones',
      label: 'ACCIONES',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => handleEdit(row)}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <RemoveButton 
          onClick={() => deleteCashBottom(row)}>

            <Trash2 className="w-4 h-4" />
          </RemoveButton>
        </div>
      )
    }
  ];

  return (
    <div className="bg-gray-50"> 
      <div className="p-1 sm:p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Gestión de Cajas Registradoras
          </h1>
        </div>

        {/* Barra de búsqueda y botones */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar caja por nombre o descripción"
          />

          <ReloadButton 
            onClick={() => fetchCajas(searchTerm)}
            disabled={loading}
            title="Recargar"
          />

          <AddButton onClick={handleCreate}>
            <Plus className="w-5 h-5" />
            Agregar Caja
          </AddButton>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="mt-2 text-gray-600">Cargando cajas...</p>
            </div>
          ) : (
            <>
              <DataTable 
                columns={columns} 
                data={cashFilter} 
              />
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{cashFilter.length}</span> de <span className="font-semibold">{totalCount}</span> cajas
                </p>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Modal de formulario */}
      <CashForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        caja={selectedCaja}
        mode={modalMode}
      />

      {/*Modal de confirm eliminar*/}
      <DeleteConfirmCash
        cash={cashes.find((u) => u.cajCod === pendingDeleteId)?.cajNom ?? "caja"}
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
            const cash = cashes.find((u) => u.cajCod === pendingDeleteId);
            if (cash) handleDelete(cash);
        }}

        loading={loading}
      />
    </div>
  );
};

export default Cajas;