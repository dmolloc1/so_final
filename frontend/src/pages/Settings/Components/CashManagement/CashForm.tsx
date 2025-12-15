import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/Modal/modal';
import FormInput from '../../../../components/Forms/FormInput';
import type { Cash } from '../../../../types/cash';

// Servicios
import { cashierUsers } from '../../../../auth/services/userService';
import { getBranches } from '../../../../services/branchService';

// Tipos
import type { User } from "../../../../auth/types/user";
import type { Branch } from '../../../../types/branch';
import { getCurrentUser } from '../../../../auth/services/userService';

interface CashFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (caja: Cash) => Promise<void>;
  caja?: Cash | null;
  mode: 'create' | 'edit';
}

interface FormErrors {
  cajNom?: string;
  cajDes?: string;
  usuCod?: string;
}

const CashForm: React.FC<CashFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  caja,
  mode
}) => {
  const initialState: Cash = {
    cajCod: 0,
    cajNom: '',
    sucurCod: 1,
    usuCod: 0,
    cajDes: '',
    cajEstado: 'ACTIVO'
  };

  const [formData, setFormData] = useState<Cash>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [usersCashier, setUsersCashier] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');

  // Obtener nombre de sucursal por sucurCod
  const getBranchNameByCod = (sucurCod: number | undefined): string => {
    if (!sucurCod) return '';
    const branch = branches.find(b => b.sucurCod === sucurCod);
    return branch?.sucurNom || `Sucursal #${sucurCod}`;
  };

  // Cargar todas las sucursales al montar
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches();
        setBranches(data);
      } catch (error) {
        console.error("Error al cargar sucursales:", error);
      }
    };
    loadBranches();
  }, []);

  // Verificar sucursal actual del usuario
  const verifyCurrentBranch = async () => {
    try {
      const u = await getCurrentUser();
      if (u && u.sucurCod) {
        const branchName = getBranchNameByCod(u.sucurCod);
        setSelectedBranchName(branchName);
        setFormData(prev => {
          if (!prev.usuCod) return { ...prev, sucurCod: u.sucurCod?? 0 };
          return prev;
        });
      }
    } catch (err) {
      console.warn('verifyCurrentBranch error:', err);
    }
  };

  // Cargar usuarios cajeros
  const fetchCashierUsers = async () => {
    try {
      const userArr = await cashierUsers();
      setUsersCashier(userArr);

      // Si ya hay un cajero seleccionado, actualizar nombre de sucursal
      if (formData.usuCod) {
        const sel = userArr.find(u => u.usuCod === formData.usuCod);
        if (sel?.sucurCod) {
          const branchName = getBranchNameByCod(sel.sucurCod);
          setSelectedBranchName(branchName);
        }
      }
    } catch (error) {
      console.error("Error al recuperar usuarios cajeros:", error);
    }
  };

  // Efecto principal: ejecutar cuando abre el modal
  useEffect(() => {
    if (isOpen) {
      verifyCurrentBranch();
      if (caja && mode === 'edit') {
        setFormData(caja);
        if (caja.sucurCod) {
          const branchName = getBranchNameByCod(caja.sucurCod);
          setSelectedBranchName(branchName);
        }
      } else {
        setFormData(initialState);
        setSelectedBranchName('');
      }
      fetchCashierUsers();
      setErrors({});
      setBackendError(null);
    }
  }, [caja, mode, isOpen, branches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'usuCod' ? parseInt(value) || 0 : value;

    setFormData(prev => {
      let updated = { ...prev, [name]: finalValue };

      // Si se selecciona un cajero, actualizar sucursal
      if (name === "usuCod") {
        const selectedUser = usersCashier.find(u => u.usuCod === finalValue);
        if (selectedUser?.sucurCod) {
          updated = { ...updated, sucurCod: selectedUser.sucurCod };
          const branchName = getBranchNameByCod(selectedUser.sucurCod);
          setSelectedBranchName(branchName);
        } else {
          setSelectedBranchName('');
        }
      }

      return updated;
    });

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.cajNom.trim()) {
      newErrors.cajNom = 'El nombre es obligatorio';
    } else if (formData.cajNom.length < 3) {
      newErrors.cajNom = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.cajDes.trim()) {
      newErrors.cajDes = 'La descripción es obligatoria';
    } else if (formData.cajDes.length < 10) {
      newErrors.cajDes = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!formData.usuCod || formData.usuCod < 1) {
      newErrors.usuCod = 'Debe seleccionar un cajero válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setBackendError(null);

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      if (error.cajNom) setErrors(prev => ({ ...prev, cajNom: error.cajNom[0] }));
      if (error.cajDes) setErrors(prev => ({ ...prev, cajDes: error.cajDes[0] }));
      if (error.usuCod) setErrors(prev => ({ ...prev, usuCod: error.usuCod[0] }));
      setBackendError('Error al guardar la caja. Por favor, verifica los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialState);
    setErrors({});
    setBackendError(null);
    setSelectedBranchName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Agregar Caja Registradora' : 'Editar Caja Registradora'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {backendError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {backendError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Nombre de la Caja"
            name="cajNom"
            type="text"
            value={formData.cajNom}
            onChange={handleChange}
            error={errors.cajNom}
            required
            placeholder="Caja Principal"
          />

          {/* Cajero asignado */}
          <div className="mb-4">
            <label htmlFor="usuCod" className="block text-sm font-medium text-gray-700 mb-2">
              Cajero asignado <span className="text-red-500">*</span>
            </label>
            <select
              id="usuCod"
              name="usuCod"
              value={formData.usuCod}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                errors.usuCod ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione un cajero</option>
              {usersCashier.map(user => (
                <option key={user.usuCod} value={user.usuCod}>
                  {user.usuNombreCom}
                </option>
              ))}
            </select>
            {errors.usuCod && (
              <p className="mt-1 text-sm text-red-600">{errors.usuCod}</p>
            )}
          </div>

          {/* Sucursal (no editable) */}
          {formData.usuCod > 0 && (
            <FormInput
              label="Sucursal"
              name="sucurNom"
              type="text"
              value={selectedBranchName}
              onChange={() => {}}
              disabled
            />
          )}

          {/* Descripción */}
          <div className="md:col-span-2">
            <label htmlFor="cajDes" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cajDes"
              name="cajDes"
              value={formData.cajDes}
              onChange={handleChange}
              placeholder="Describe el propósito y ubicación de esta caja"
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none ${
                errors.cajDes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cajDes && (
              <p className="mt-1 text-sm text-red-600">{errors.cajDes}</p>
            )}
          </div>

          {/* Estado */}
          <div className="mb-4">
            <label htmlFor="cajEstado" className="block text-sm font-medium text-gray-700 mb-2">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              id="cajEstado"
              name="cajEstado"
              value={formData.cajEstado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="ACTIVO">Activo</option>
              <option value="DESACTIVADO">Desactivado</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Agregar' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CashForm;