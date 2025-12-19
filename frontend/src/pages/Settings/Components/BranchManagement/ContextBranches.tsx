// BranchesContext.tsx
import React, { createContext, useState, useContext } from "react";

interface BranchesContextType {
  isNeedUpdate: boolean;
  setIsNeedUpdate: React.Dispatch<React.SetStateAction<boolean>>;
}

const BranchesContext = createContext<BranchesContextType | undefined>(undefined);

export const BranchesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNeedUpdate, setIsNeedUpdate] = useState<boolean>(false);

  return (
    <BranchesContext.Provider value={{ isNeedUpdate, setIsNeedUpdate }}>
      {children}
    </BranchesContext.Provider>
  );
};

// Hook para usar el contexto fácilmente
export const useBranchesContext = () => {
  const ctx = useContext(BranchesContext);
  if (!ctx) {
    throw new Error("useBranchesContext debe usarse dentro de BranchesProvider");
  }
  return ctx;
};

// AGREGADO: Export default para mayor compatibilidad (opcional)
export default BranchesProvider;