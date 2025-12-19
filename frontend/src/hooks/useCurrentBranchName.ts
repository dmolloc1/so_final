import { useBranch } from '../context/BranchContext';
import { useState, useEffect } from 'react';
import * as userService from '../auth/services/userService';

/**
 * Hook personalizado que obtiene el nombre de la sucursal actual
 * Con fallback para obtener del usuario si el contexto no está disponible
 */
export const useCurrentBranchName = (): string => {
    const { branches, currentBranchId } = useBranch();
    const [branchName, setBranchName] = useState<string>('—');

    useEffect(() => {
        const getBranchName = async () => {
            // Intentar primero desde el contexto
            if (currentBranchId && branches.length > 0) {
                const branch = branches.find(b => b.sucurCod === currentBranchId);
                if (branch) {
                    setBranchName(branch.sucurNom);
                    return;
                }
            }

            // Fallback: obtener del usuario directamente
            try {
                const user = await userService.getCurrentUser();
                if (user.sucurCod && branches.length > 0) {
                    const branch = branches.find(b => b.sucurCod === user.sucurCod);
                    if (branch) {
                        setBranchName(branch.sucurNom);
                        return;
                    }
                }
                // Si no hay sucursal, mantener el valor por defecto
                setBranchName('Sin sucursal');
            } catch (error) {
                console.error('Error obteniendo nombre de sucursal:', error);
                setBranchName('Error');
            }
        };

        getBranchName();
    }, [currentBranchId, branches]);

    return branchName;
};
