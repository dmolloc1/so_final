// 🔹 Responsable: Denise
// Tareas:
// 1. Crear tabla con proveedores, en el trello ya esta para qeu te guies.
// 2. Agregar formulario CRUD (crear, editar, eliminar).
// 3. Integrar con el backend (/api/proveedores/).
// 4. Mostrar en Configuración junto con Sucursales.

import React, { useEffect, useState } from 'react';
import {  Plus, Edit2, Trash2,RefreshCw } from 'lucide-react';
import DataTable, { type Column } from "../../../../components/Table/DataTable";
import ProveedorForm from './ProveedorForm';
import supplierService, {type Supplier} from '../../../../services/supplierService';

//Cambio: Nuevos componentes Commons
import AddButton from '../../../../components/Common/AddButton';
import SearchInput from '../../../../components/Common/SearchInput';
import RemoveButton from '../../../../components/Common/RemoveButton';
import ReloadButton from '../../../../components/Common/ReloadButton';
import { notifyError } from '../../../../shared/notifications';

const Proveedores: React.FC = () => {
  // Estado para almacenar los proveedores
  const [proveedores, setProveedores] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Supplier | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchProveedores();
  }, []);

  // Función para cargar proveedores desde el backend
  const fetchProveedores = async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching suppliers...');
      const data = await supplierService.getAll({
        search: search || undefined,
      });
      console.log('Suppliers loaded:', data);
      setProveedores(data);
      setTotalCount(data.length);
    } catch (err: any) {
      console.error('Error loading suppliers:', err);
      setError('Error al cargar los proveedores. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };



  const normalizeText = (text: string) => text.normalize('NFD').toLowerCase();

  // Para filtrar proveedores según el término de búsqueda(segun razon social o ruc)
  const proveedoresFiltrados = proveedores.filter(proveedor =>
    normalizeText(proveedor.provRazSocial).includes(normalizeText(searchTerm)) ||
    proveedor.provRuc.includes(searchTerm)
  );

  // Abrir modal para crear
  const handleCreate = () => {
    setModalMode('create');
    setSelectedProveedor(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (proveedor: Supplier) => {
    setModalMode('edit');
    setSelectedProveedor(proveedor);
    setIsModalOpen(true);
  };

  // eliminar proveedor 
  const handleDelete = async (proveedor: Supplier) => {
    if (window.confirm(`¿Estás seguro de eliminar al proveedor "${proveedor.provRazSocial}"?`)) {
      try {
        await supplierService.delete(proveedor.provCod!);
        await fetchProveedores(searchTerm);
        console.log('Proveedor eliminado exitosamente');
      } catch (err: any) {
        console.error('Error al eliminar:', err);
        notifyError('Error al eliminar el proveedor');
      }
    }
  };

  // guardar proveedor
  const handleSubmit = async (proveedor: Supplier) => {
    try {
      if (modalMode === 'create') {
        await supplierService.create(proveedor);
        console.log('Proveedor creado exitosamente');
      } else {
        await supplierService.update(proveedor.provCod!, proveedor);
        console.log('Proveedor actualizado exitosamente');
      }
      await fetchProveedores(searchTerm);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error al guardar:', err);
      throw err; 
    }
  };


  // Definir las columnas de la tabla
  const columns: Column<Supplier>[] = [
    {
      key: 'provCod',
      label: 'CÓDIGO',
      render: (row) => (
        <span className="text-gray-900 font-medium">{row.provCod}</span>
      )
    },
    {
      key: 'provRuc',
      label: 'RUC',
      render: (row) => (
        <span className="text-gray-900">{row.provRuc}</span>
      )
    },
    {
      key: 'provRazSocial',
      label: 'RAZÓN SOCIAL',
      render: (row) => (
        <span className="text-gray-900 font-semibold">{row.provRazSocial}</span>
      )
    },
    {
      key: 'provTele',
      label: 'TELÉFONO',
      render: (row) => (
        <span className="text-gray-600">{row.provTele}</span>
      )
    },
    {
      key: 'provCiu',
      label: 'CIUDAD',
      render: (row) => (
        <span className="text-gray-600">{row.provCiu}</span>
      )
    },
    {
      key: 'provEstado',
      label: 'ESTADO',
      render: (row) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          row.provEstado === 'Active' 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {row.provEstado === 'Active' ? 'Activo' : 'Inactivo'}
        </span>
      )
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
            onClick={() => handleDelete(row)}
          >
            <Trash2 className="w-4 h-4" />
          </RemoveButton>
        </div>
      )
    }
  ];
  
  {/*<div className="min-h-screen bg-gray-50 p-6">*/}
  return (
    <div className="bg-gray-50"> 
      <div className="p-1 sm:p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Gestión de Proveedores
          </h1>
        </div>

        {/* Barra de búsqueda y botones */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar proveedor por nombre o RUC"
        />

          <ReloadButton 
            onClick={() => fetchProveedores(searchTerm)}
            disabled={loading}
            title="Recargar"
          >
          </ReloadButton>

          <AddButton 
            onClick={handleCreate}
            
          >
            <Plus className="w-5 h-5" />
            Agregar Proveedor
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
              <p className="mt-2 text-gray-600">Cargando proveedores...</p>
            </div>
          ) : (
            <>
              <DataTable 
                columns={columns} 
                data={proveedoresFiltrados} 
              />
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{proveedoresFiltrados.length}</span> de <span className="font-semibold">{totalCount}</span> proveedores
                </p>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Modal de formulario */}
      <ProveedorForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        proveedor={selectedProveedor}
        mode={modalMode}
      />
    </div>
  );
};

export default Proveedores;
