
// BranchManagement/Branches.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import DataTable, { type Column } from "../../../../components/Table/DataTable";
import * as branchService from "../../../../services/branchService";
import BranchesForm from './branchesForm';

// Cambio: Nuevos componentes Commons
import AddButton from '../../../../components/Common/AddButton';
import SearchInput from '../../../../components/Common/SearchInput';
import RemoveButton from '../../../../components/Common/RemoveButton';
import ReloadButton from '../../../../components/Common/ReloadButton';

// Type
import type { Branch } from '../../../../types/branch';
import DeleteConfirmModal from '../BranchManagement/DeleteConfirmModal';
import { notifyError } from '../../../../shared/notifications';

//Para actualizar las branches
import { useBranchesContext } from './ContextBranches';

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "Active" | "Inactive">("all");
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const { setIsNeedUpdate } = useBranchesContext();

  useEffect(() => {
    fetchBranches();
  }, []);

  // Función para cargar sucursales desde el backend
  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching branches...');
      const data = await branchService.getBranches();
      console.log('Branches loaded:', data);
      setBranches(data);
      setTotalCount(data.length);
    } catch (err: any) {
      console.error('Error loading branches:', err);
      setError('Error al cargar las sucursales. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const normalizeText = (text: string) => text.normalize('NFD').toLowerCase();

  // Filtrar sucursales según el término de búsqueda y estado
  const branchesFiltradas = branches.filter(branch => {
    const matchesSearch = 
      normalizeText(branch.sucurNom).includes(normalizeText(searchTerm)) ||
      normalizeText(branch.sucurCiu).includes(normalizeText(searchTerm)) ||
      branch.sucurTel.includes(searchTerm);
    
    const matchesStatus = 
      selectedStatus === "all" || branch.sucurEstado === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Abrir modal para crear
  const handleCreate = () => {
    setModalMode('create');
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (branch: Branch) => {
    setModalMode('edit');
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  // Eliminar sucursal (confirmación ya hecha por el modal)
    const handleDelete = async () => {
    if (!pendingDeleteId) return;
    
    setLoading(true); // ← Importante para mostrar "Eliminando..."
    try {
        await branchService.deleteBranch(pendingDeleteId.toString());
        console.log('Eliminando sucursal:', pendingDeleteId);
        await fetchBranches();
        console.log('Sucursal eliminada exitosamente');
    } catch (err: any) {
        console.error('Error al eliminar:', err);
        notifyError('Error al eliminar la sucursal');
    } finally {
        setLoading(false);
        setConfirmDeleteOpen(false);
        setPendingDeleteId(null);
    }
    };

  // Guardar sucursal
  const handleSubmit = async (branch: Omit<Branch, 'sucurCod'> | Branch) => {
    try {
      if (modalMode === 'create') {
        console.log(branch);
        await branchService.createBranch(branch as Omit<Branch, 'sucurCod'>);
        
        console.log('Sucursal creada exitosamente');
      } else {
        const branchWithId = branch as Branch;
        await branchService.updateBranch(branchWithId.sucurCod.toString(), branchWithId);
        console.log('Sucursal actualizada exitosamente');
      }
      
      await fetchBranches();
      setIsNeedUpdate(true);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error al guardar:', err);
      throw err;
    }
  };

  // Definir las columnas de la tabla
  const columns: Column<Branch>[] = [
    {
      key: 'sucurCod',
      label: 'CÓDIGO',
      render: (row) => (
        <span className="text-gray-900 font-medium">{row.sucurCod}</span>
      )
    },
    {
      key: 'sucurNom',
      label: 'NOMBRE',
      render: (row) => (
        <span className="text-gray-900 font-semibold">{row.sucurNom}</span>
      )
    },
    {
      key: 'sucurDep',
      label: 'DEPARTAMENTO',
      render: (row) => (
        <span className="text-gray-600">{row.sucurDep.replace(/_/g, ' ')}</span>
      )
    },
    {
      key: 'sucurCiu',
      label: 'CIUDAD',
      render: (row) => (
        <span className="text-gray-600">{row.sucurCiu}</span>
      )
    },
    {
      key: 'sucurTel',
      label: 'TELÉFONO',
      render: (row) => (
        <span className="text-gray-600">{row.sucurTel}</span>
      )
    },
    {
      key: 'sucurEstado',
      label: 'ESTADO',
      render: (row) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          row.sucurEstado === 'Active' 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {row.sucurEstado === 'Active' ? 'Activo' : 'Inactivo'}
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
            onClick={() => {
            setPendingDeleteId(row.sucurCod);
            setConfirmDeleteOpen(true);
            }}
        >
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
            Gestión de Sucursales
          </h1>
        </div>

        {/* Barra de búsqueda, filtros y botones */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar sucursal por nombre, ciudad o teléfono"
            />

            {/* Filtro de Estado */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as "all" | "Active" | "Inactive")}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="Active">Activos</option>
              <option value="Inactive">Inactivos</option>
            </select>

            <ReloadButton 
              onClick={() => fetchBranches()}
              disabled={loading}
              title="Recargar"
            />

            <AddButton onClick={handleCreate}>
              <Plus className="w-5 h-5" />
              Agregar Sucursal
            </AddButton>
          </div>
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
              <p className="mt-2 text-gray-600">Cargando sucursales...</p>
            </div>
          ) : (
            <>
              <DataTable 
                columns={columns} 
                data={branchesFiltradas} 
              />
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{branchesFiltradas.length}</span> de <span className="font-semibold">{totalCount}</span> sucursales
                </p>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Modal de formulario */}
      <BranchesForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        branch={selectedBranch}
        mode={modalMode}
      />
        {/* Modal de formulario */}
    <BranchesForm
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleSubmit}
      branch={selectedBranch}
      mode={modalMode}
    />

    {/* Modal de confirmación de eliminación */}
    <DeleteConfirmModal
      SucurNom={branches.find((b) => b.sucurCod === pendingDeleteId)?.sucurNom ?? "esta sucursal"}
      open={confirmDeleteOpen}
      onClose={() => {
        setConfirmDeleteOpen(false);
        setPendingDeleteId(null);
      }}
      onConfirm={handleDelete}
      loading={loading}
    />
    </div>
  );
};

export default Branches;
