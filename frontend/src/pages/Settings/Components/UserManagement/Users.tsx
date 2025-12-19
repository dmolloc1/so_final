// src/pages/.../Users.tsx
import React, { useEffect, useState } from "react";
import { Plus } from 'lucide-react';
//Commons
import SearchInput from "../../../../components/Common/SearchInput";
import ReloadButton from "../../../../components/Common/ReloadButton";
import AddButton from "../../../../components/Common/AddButton";
import MoreInfoButton from "../../../../components/Common/MoreInfoButton";

import * as userService from "../../../../auth/services/userService";
import type { User } from "../../../../auth/types/user";
import { useBranch } from "../../../../context/BranchContext"; // ✅ NUEVO IMPORT

//import icons of roles
import cajeroImg from '../../../../assets/roles/Cajero.png';
import gerenteImg from '../../../../assets/roles/Gerente.png';
import logisticaImg from '../../../../assets/roles/Logistica.png';
import optometraImg from '../../../../assets/roles/Optometra.png';
import vendedorImg from '../../../../assets/roles/Vendedor.png';

//Userform
import UsersForm from "./UsersForm";
import DeleteConfirmModal from "./DeleteConfirmModal";

const Users: React.FC = () => {
  const { currentBranchId, isManager } = useBranch(); //   USAR CONTEXTO
  
  //Filtro Principal POR SUCURSAL
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  //Busqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRol, setRolFilter] = useState<string>("");
  const [selectedStatus, setStatusFilter] = useState("all");
  //Demas
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await userService.listUsers();
      // Normalización aquí, sobre `data` problema active inactive
      const normalizedUsers = data.map((u: any) => ({
        ...u,
        usuEstado: u.usuEstado ?? u.is_active ?? false,
      }));

      setUsers(normalizedUsers);
      setTotalCount(data.length);
    } catch (err) {
      console.error("Error al capturar los usuarios", err);
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  // MODIFICADO: Recargar cuando cambie la sucursal
  useEffect(() => {
    void fetchUsers();
  }, [currentBranchId]); // DEPENDENCIA AGREGADA

  // Select user details (for edit, UPDATE O cambiar contraseña, eliminarlo)
  const selectUser = async (usuCod: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUser(usuCod);
      setSelectedUser(data);
      setModalMode("edit");
      setModalOpen(true);
    } catch (err) {
      console.error("Error al seleccionar usuario", err);
      setError("Error al obtener datos del usuario");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (usuCod: number) => {
    setPendingDeleteId(usuCod);
    setConfirmDeleteOpen(true);
  };

  // Handlers for create / edit / delete
  const handleCreate = () => {
    setModalMode("create");
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (pendingDeleteId === null) return;
    setLoading(true);
    try {
      await userService.deleteUser(pendingDeleteId);
      setUsers((prev) => prev.filter((u) => u.usuCod !== pendingDeleteId));
      setTotalCount((c) => Math.max(0, c - 1));
      setConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    } catch (err) {
      console.error("Error al eliminar usuario", err);
    } finally {
      setLoading(false);
    }
  };

  // Modal submit (create or update) para ambos actualiza la vista aumentar if contraseña pasado hacer el new
  const handleModalSubmit = async (userPayload: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      if (modalMode === "create") {
        const { ...payload } = userPayload;
        const created = await userService.createUser(payload as Omit<User, "usuCod">);
        setUsers((prev) => [created, ...prev]);
        setTotalCount((c) => c + 1);
      } else if (modalMode === "edit" && selectedUser) {
        const updated = await userService.updateUser(selectedUser.usuCod!, userPayload);
        setUsers((prev) =>
          prev.map((u) => (u.usuCod === updated.usuCod ? updated : u))
        );
      }
      setModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Error al guardar usuario", err);
      setError("Error al guardar usuario");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter using searchTerm falta filtrar por rol y sucursal
  const filteredUsers = users.filter((u) => {
    // --- búsqueda por texto ---
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        String(u.usuNombreCom ?? "").toLowerCase().includes(s) ||
        (u.usuNom ?? "").toLowerCase().includes(s) ||
        (u.usuEmail ?? "").toLowerCase().includes(s);

      if (!matchesSearch) return false;
    }

    // --- filtro por rol ---
    if (selectedRol) {
      const userRole = String(u.roles?.[0]?.rolNom ?? "").toUpperCase();
      if (userRole !== selectedRol.toUpperCase()) return false;
    }

    // --- filtro por estado ---
    const isActive = Boolean(u.usuEstado);

    if (selectedStatus === "active" && !isActive) return false;
    if (selectedStatus === "inactive" && isActive) return false;

    return true;
  });

  return (
    <div className="p-1 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        {/*Div de arriba solo titulo y boton de agregar  */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1>
            {/* NUEVO: Indicador de filtrado por sucursal */}
            {!isManager && currentBranchId && (
              <p className="text-sm text-gray-500 mt-1">
                Mostrando usuarios de tu sucursal
              </p>
            )}
          </div>
          <AddButton onClick={handleCreate}>
            <Plus className="w-5 h-5" /> 
            Agregar Usuario
          </AddButton>
        </div>
        <div className="flex items-center gap-3 mt-">
          <SearchInput value={searchTerm} onChange={(v: string) => setSearchTerm(v)} placeholder="Buscar por nombre, email o ID" />
          {/* Filtro por rol */}
          <select
            value={selectedRol}
            onChange={(e) => setRolFilter(e.target.value)}
            className="border rounded px-1 py-2 border-gray-200"
          >
            <option value="">Todos</option>
            <option value="CAJERO">Cajero</option>
            <option value="GERENTE">Gerente</option>
            <option value="LOGISTICA">Logística</option>
            <option value="OPTOMETRA">Optómetra</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="VENDEDOR">Vendedor</option>
          </select>

          {/* Filtro por estado */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded ${selectedStatus === "all" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded ${selectedStatus === "active" ? "bg-green-500 text-white" : "bg-gray-200"}`}
            >
              Activos
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded ${selectedStatus === "inactive" ? "bg-red-500 text-white" : "bg-gray-200"}`}
            >
              Inactivos
            </button>
          </div>

          <ReloadButton onClick={() => void fetchUsers()} disabled={loading} title="Recargar" />
        </div>
        <div className="bg-gray rounded-lg shadow-sm p-4 mt-4">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <div className="bg-white rounded-lg shadow-sm p-6">
            {loading ? (
              <div className="text-center py-8">
                <span className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-2 text-gray-600">Cargando usuarios...</p>
              </div>
            ) : (
              <> 
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredUsers.map((u) => {
                    // Obtener título/puesto desde roles (si existe)
                    const job = u.roles && u.roles.length > 0 ? String(u.roles[0].rolNom) : "";

                    return (
                      <article  
                        key={u.usuCod ?? `${u.usuEmail}-${Math.random()}`}
                        className="relative flex flex-col items-center bg-white rounded-lg p-6 shadow-2xl ring-1 ring-black/5"
                      >
                        {/* Estado + botón de opciones */}
                        <div className="absolute top-3 right-3 flex items-center gap-2 ">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              u.usuEstado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {u.usuEstado ? "Active" : "Inactive"}
                          </span>

                          <MoreInfoButton 
                            onView={() => void selectUser(u.usuCod!)}
                            onDelete={() => void deleteUser(u.usuCod!)}
                          />
                        </div>

                        {/* Imagen de perfil según rol */}
                        <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mb-3 mt-7 shadow-lg ring-2 ring-gray-300">
                          <img
                            src={
                              job === "CAJERO" ? cajeroImg :
                              job === "GERENTE" ? gerenteImg :
                              job === "SUPERVISOR" ? gerenteImg :
                              job === "LOGISTICA" ? logisticaImg :
                              job === "OPTOMETRA" ? optometraImg :
                              job === "VENDEDOR" ? vendedorImg :
                              "/static/images/default-avatar.png"
                            }
                            alt={u.usuNombreCom}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>

                        {/* Información centrada */}
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900">{u.usuNombreCom}</h3>
                          <p className="text-sm text-gray-500">{u.usuNom}</p>
                          <p className="text-sm text-gray-500">{u.usuEmail}</p>
                        </div>

                        {/* Rol centrado */}
                        {job && (
                          <div className="mt-3">
                            <span
                              className={`inline-block text-xs px-3 py-1 rounded-full text-white`}
                              style={{
                                backgroundColor:
                                  job === "VENDEDOR" ? "#f9b85a" :
                                  job === "GERENTE" ? "#9362de" :
                                  job === "LOGISTICA" ? "#5bd18f" :
                                  job === "OPTOMETRA" ? "#58d0d5" :
                                  job === "CAJERO" ? "#ff78ca" :
                                  job === "SUPERVISOR" ? "#9362de" :
                                  "#6b7280", // fallback gris
                              }}
                            >
                              {job}
                            </span>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                {/*El contador de resultados*/}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{filteredUsers.length}</span> de <span className="font-semibold">{totalCount}</span> usuarios
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        username={users.find((u) => u.usuCod === pendingDeleteId)?.usuNom ?? "usuario"}
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />

      {/* Modal de formulario de agregar usuario o editar*/}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
            <UsersForm
              isOpen={true}
              onClose={() => setModalOpen(false)}
              user={selectedUser}
              onSubmit={handleModalSubmit}
              mode={modalMode}
              isManager={isManager} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;