import SettingsTabs from "./Components/Tabs/SettingsTabs";
import { Outlet } from "react-router-dom";
import { getBranches } from "../../services/branchService";
import * as userService from "../../auth/services/userService";
import { useState, useEffect } from "react";
import type { User } from "../../auth/types/user";
import type { Branch } from "../../types/branch";
import { useBranch } from "../../context/BranchContext";
import { useBranchesContext } from "./Components/BranchManagement/ContextBranches";
import { notifyError, notifySuccess, notifyWarning } from "../../shared/notifications";

export default function Settings() {
  const { updateBranch } = useBranch();
  const [isManager, setIsManagerUser] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const selectedBranchName = branches.find(b => b.sucurCod === selectedBranchId)?.sucurNom ?? '—';
  const [isSaving, setIsSaving] = useState(false);
  
  // NUEVO: Obtener el contexto de branches para detectar actualizaciones
  const { isNeedUpdate, setIsNeedUpdate } = useBranchesContext();

  useEffect(() => {
    checkIfManager();
    currentBranch();
    fetchBranches();
  }, []);


  useEffect(() => {
    if (isNeedUpdate) {
      fetchBranches();
      setIsNeedUpdate(false); // Resetear el flag
    }
  }, [isNeedUpdate]);

  // MODIFICADO: Convertido a función reutilizable
  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (error) {
      console.log("Error al recuperar las branches", error);
    }
  };

  const currentBranch = async () => {
    try {
      const user = await userService.getCurrentUser();
      setSelectedBranchId(user.sucurCod);
    } catch (error) {
      console.log("Error al obtener branch", error);
    }
  };

  const checkIfManager = async () =>{
      const isManager = await userService.checkIfManager();
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
      setIsManagerUser(isManager);
  };

  //Utilizamos el contexto para actualizar la branch
  // MODIFICADO: Ahora usa el contexto para actualizar
  const handleBranchUpdate = async () => {
    if (!currentUser || !selectedBranchId) {
      notifyWarning("Por favor selecciona una sucursal");
      return;
    }
    
    setIsSaving(true);
    try {
      await updateBranch(selectedBranchId); // USA EL CONTEXTO
      notifySuccess("Sucursal actualizada correctamente. La página se recargará.");
    } catch (err) {
      console.error("Error al actualizar sucursal", err);
      notifyError("Error al actualizar sucursal");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con selector de sucursal */}
      <div className="mb-9 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Configuración y Administración de acceso
          </h1>
          <p className="text-gray-600 pl-2">
            Administra, redefine y controla el acceso e información de la empresa
          </p>
        </div>
        {!isManager&&(
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Sucursal del sistema: {selectedBranchName}</label>
        </div>
        )}
        {isManager && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Sucursal del sistema: </label>
            <select
              value={selectedBranchId ?? ""}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              disabled={isSaving}
            >
              <option value="">Selecciona una sucursal</option>
              {branches.map((branch) => (
                <option key={branch.sucurCod} value={branch.sucurCod}>
                  {branch.sucurNom}
                </option>
              ))}
            </select>
            <button
              onClick={handleBranchUpdate}
              disabled={isSaving || !selectedBranchId}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>
      {/* Tabs y contenido */}
      <SettingsTabs />
      <Outlet />
    </div>
  );
}
