import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Branch } from '../types/branch';
import { getBranches } from '../services/branchService';
import * as userService from '../auth/services/userService';

// Verificador de sesión lista
const isSessionReady = () => {
  const access = localStorage.getItem('access');
  const refresh = localStorage.getItem('refresh');
  const user = localStorage.getItem('user');
  return !!access && !!refresh && !!user;
};

interface BranchContextType {
  currentBranchId: number | undefined;
  branches: Branch[];
  isManager: boolean;
  loading: boolean;
  setCurrentBranchId: (branchId: number | undefined) => void;
  updateBranch: (branchId: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBranchId, setCurrentBranchId] = useState<number | undefined>(undefined);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSessionReady()) {
      initializeBranchData();
    } else {
      setLoading(false);
    }
  }, []);

  const initializeBranchData = async () => {
    setLoading(true);
    try {
      const branchesData = await getBranches();
      setBranches(branchesData);

      const managerStatus = await userService.checkIfManager();
      setIsManager(managerStatus);

      const currentUser = await userService.getCurrentUser();
      setCurrentBranchId(currentUser.sucurCod);

      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Error al inicializar datos de sucursal:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBranch = async (branchId: number) => {
    try {
      const currentUser = await userService.getCurrentUser();
      await userService.updateUser(currentUser.usuCod!, { sucurCod: branchId });

      setCurrentBranchId(branchId);
      const updatedUser = { ...currentUser, sucurCod: branchId };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar sucursal:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    if (isSessionReady()) {
      await initializeBranchData();
    }
  };

  return (
    <BranchContext.Provider
      value={{
        currentBranchId,
        branches,
        isManager,
        loading,
        setCurrentBranchId,
        updateBranch,
        refreshData,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch debe ser usado dentro de un BranchProvider');
  }
  return context;
};