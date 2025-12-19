
import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/Modal/modal';
import FormInput from '../../../../components/Forms/FormInput';
import { type Supplier } from '../../../../services/supplierService';


interface ProveedorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proveedor: Supplier) => Promise<void>;
  proveedor?: Supplier | null;
  mode: 'create' | 'edit';
}

interface FormErrors {
  provRuc?: string;
  provRazSocial?: string;
  provDirec?: string;
  provTele?: string;
  provEmail?: string;
  provCiu?: string;
}

const ProveedorForm: React.FC<ProveedorFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  proveedor,
  mode
}) => {
    const initialState: Supplier = {
      provRuc: '',
      provRazSocial: '',
      provDirec: '',
      provTele: '',
      provEmail: '',
      provCiu: '',
      provEstado: 'Active'
    };
    const [formData, setFormData] = useState<Supplier>(initialState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);

    useEffect(() => {
        if (proveedor && mode === 'edit') {
          setFormData(proveedor);
        } else {
          setFormData(initialState);
        }
        setErrors({});
        setBackendError(null);
    }, [proveedor, mode, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: value
        }));
        
        // Limpiar error del campo cuando el usuario escribe
        if (errors[name as keyof FormErrors]) {
        setErrors(prev => ({
            ...prev,
            [name]: undefined
        }));
        }
    };

    const validate = (): boolean => {
      const newErrors: FormErrors = {};

      // Validar RUC (11 dígitos)
      if (!formData.provRuc.trim()) {
        newErrors.provRuc = 'El RUC es obligatorio';
      } else if (!/^\d{11}$/.test(formData.provRuc)) {
        newErrors.provRuc = 'El RUC debe tener 11 dígitos';
      }

      // Validar Razón Social
      if (!formData.provRazSocial.trim()) {
        newErrors.provRazSocial = 'La razón social es obligatoria';
      } else if (formData.provRazSocial.length < 3) {
        newErrors.provRazSocial = 'La razón social debe tener al menos 3 caracteres';
      }

     // Validar Dirección
      if (!formData.provDirec.trim()) {
        newErrors.provDirec = 'La dirección es obligatoria';
      }

      // Validar Teléfono (9 dígitos)
      if (!formData.provTele.trim()) {
        newErrors.provTele = 'El teléfono es obligatorio';
      } else if (!/^\d{9}$/.test(formData.provTele)) {
        newErrors.provTele = 'El teléfono debe tener 9 dígitos';
      }

      // Validar Email
      if (!formData.provEmail.trim()) {
        newErrors.provEmail = 'El email es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.provEmail)) {
        newErrors.provEmail = 'El email no es válido';
      }

      // Validar Ciudad
      if (!formData.provCiu.trim()) {
        newErrors.provCiu = 'La ciudad es obligatoria';
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
          
          // Manejar errores del backend
          if (error.provRuc) {
            setErrors(prev => ({ ...prev, provRuc: error.provRuc[0] }));
          }
          if (error.provTele) {
            setErrors(prev => ({ ...prev, provTele: error.provTele[0] }));
          }
          if (error.provEmail) {
            setErrors(prev => ({ ...prev, provEmail: error.provEmail[0] }));
          }
          if (error.provRazSocial) {
            setErrors(prev => ({ ...prev, provRazSocial: error.provRazSocial[0] }));
          }

          
          setBackendError('Error al guardar el proveedor. Por favor, verifica los datos.');
        } finally {
        setIsSubmitting(false);
        }
    };

    // Cerrar modal y limpiar formulario
    const handleClose = () => {
        setFormData(initialState);
        setErrors({});
        setBackendError(null);
        onClose();
    };

    return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Agregar Proveedor' : 'Editar Proveedor'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Mostrar error del backend si existe */}
        {backendError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {backendError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* RUC */}
          <FormInput
            label="RUC"
            name="provRuc"
            type="text"
            value={formData.provRuc}
            onChange={handleChange}
            error={errors.provRuc}
            required
            placeholder="20567890123"
            maxLength={11}
          />

          {/* Razón Social */}
          <FormInput
            label="Razón Social"
            name="provRazSocial"
            type="text"
            value={formData.provRazSocial}
            onChange={handleChange}
            error={errors.provRazSocial}
            required
            placeholder="Distribuidora Médica SAC"
          />

          {/* Dirección */}
          <div className="md:col-span-2">
            <FormInput
              label="Dirección"
              name="provDirec"
              type="text"
              value={formData.provDirec}
              onChange={handleChange}
              error={errors.provDirec}
              required
              placeholder="Av. Principal 123, Lima"
            />
          </div>

          {/* Teléfono */}
          <FormInput
            label="Teléfono"
            name="provTele"
            type="tel"
            value={formData.provTele}
            onChange={handleChange}
            error={errors.provTele}
            required
            placeholder="987654321"
            maxLength={9}
          />

          {/* Email */}
          <FormInput
            label="Email"
            name="provEmail"
            type="email"
            value={formData.provEmail}
            onChange={handleChange}
            error={errors.provEmail}
            required
            placeholder="contacto@empresa.com"
          />

          {/* Ciudad */}
          <FormInput
            label="Ciudad"
            name="provCiu"
            type="text"
            value={formData.provCiu}
            onChange={handleChange}
            error={errors.provCiu}
            required
            placeholder="Lima"
          />

          {/* Estado */}
          <div className="mb-4">
            <label 
              htmlFor="provEstado" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              id="provEstado"
              name="provEstado"
              value={formData.provEstado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="Active">Activo</option>
              <option value="Inactive">Inactivo</option>
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
export default ProveedorForm;
