import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/Modal/modal';
import FormInput from '../../../../components/Forms/FormInput';
import { type Client } from '../../../../services/clientService';

interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cliente: Client) => Promise<void>;
  client?: Client | null;
  mode: 'create' | 'edit';
}

interface FormErrors {
  cli_tipo_doc?: string;
  cli_dni?: string;
  cli_nombre?: string;
  cli_apellido?: string;
  cli_email?: string;
  cli_telefono?: string;
  cli_direccion?: string;
  cli_ciudad?: string;
  cli_fecha_nac?: string;
}

const ClienteForm: React.FC<ClienteFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  client,
  mode
}) => {
  const initialState: Client = {
    cli_tipo_doc: 'DNI',
    cli_dni: '',
    cli_nombre: '',
    cli_apellido: '',
    cli_email: '',
    cli_telefono: '',
    cli_direccion: '',
    cli_ciudad: 1,
    cli_fecha_nac: ''  
  };

  const [formData, setFormData] = useState<Client>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const normalizeDate = (date?: string | null): string => {
    if (!date) return '';
    return date.split('T')[0];
  };

  useEffect(() => {
    if (client && mode === 'edit') {
      setFormData({
        ...client,
        cli_fecha_nac: normalizeDate(client.cli_fecha_nac),
      });
    } else {
      setFormData(initialState);
    }
    setErrors({});
    setBackendError(null);
  }, [client, mode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cli_ciudad' ? parseInt(value) || 1 : value
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.cli_tipo_doc) {
      newErrors.cli_tipo_doc = 'El tipo de documento es obligatorio';
    }

    if (!formData.cli_dni.trim()) {
      newErrors.cli_dni = 'El numero de documento es obligatorio';
    } else {
      if (formData.cli_tipo_doc === 'DNI') {
        if (!/^\d{8}$/.test(formData.cli_dni)) {
          newErrors.cli_dni = 'El DNI debe tener 8 digitos';
        }
      } else if (formData.cli_tipo_doc === 'CE') {
        if (!/^[A-Z0-9]{9,12}$/i.test(formData.cli_dni)) {
          newErrors.cli_dni = 'El Carnet debe tener entre 9 y 12 caracteres alfanumericos';
        }
      }
    }

    if (!formData.cli_nombre.trim()) {
      newErrors.cli_nombre = 'El nombre es obligatorio';
    } else if (formData.cli_nombre.length < 2) {
      newErrors.cli_nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.cli_apellido.trim()) {
      newErrors.cli_apellido = 'El apellido es obligatorio';
    } else if (formData.cli_apellido.length < 2) {
      newErrors.cli_apellido = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!formData.cli_email.trim()) {
      newErrors.cli_email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.cli_email)) {
      newErrors.cli_email = 'El email no es valido';
    }

    if (!formData.cli_telefono.trim()) {
      newErrors.cli_telefono = 'El telefono es obligatorio';
    } else if (!/^\d{9}$/.test(formData.cli_telefono)) {
      newErrors.cli_telefono = 'El telefono debe tener 9 digitos';
    }

    if (!formData.cli_direccion.trim()) {
      newErrors.cli_direccion = 'La direccion es obligatoria';
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

      if (error.cli_dni) {
        setErrors(prev => ({ ...prev, cli_dni: error.cli_dni[0] }));
      }
      if (error.cli_email) {
        setErrors(prev => ({ ...prev, cli_email: error.cli_email[0] }));
      }
      if (error.cli_telefono) {
        setErrors(prev => ({ ...prev, cli_telefono: error.cli_telefono[0] }));
      }

      setBackendError('Error al guardar el cliente. Por favor, verifica los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        title={mode === 'create' ? 'Agregar Cliente' : 'Editar Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          {backendError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {backendError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="mb-4">
              <label
                htmlFor="cli_tipo_doc"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tipo de Documento <span className="text-red-500">*</span>
              </label>
              <select
                id="cli_tipo_doc"
                name="cli_tipo_doc"
                value={formData.cli_tipo_doc}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="DNI">DNI</option>
                <option value="CE">Carnet de extranjeria</option>
              </select>
              {errors.cli_tipo_doc && (
                <p className="mt-1 text-sm text-red-500">{errors.cli_tipo_doc}</p>
              )}
            </div>

            <FormInput
              label="Numero de Documento"
              name="cli_dni"
              type="text"
              value={formData.cli_dni}
              onChange={handleChange}
              error={errors.cli_dni}
              required
              placeholder={formData.cli_tipo_doc === 'DNI' ? '12345678' : '001234567'}
              maxLength={formData.cli_tipo_doc === 'DNI' ? 8 : 12}
            />

            <FormInput
              label="Nombre"
              name="cli_nombre"
              type="text"
              value={formData.cli_nombre}
              onChange={handleChange}
              error={errors.cli_nombre}
              required
              placeholder="Juan"
            />

            <FormInput
              label="Apellido"
              name="cli_apellido"
              type="text"
              value={formData.cli_apellido}
              onChange={handleChange}
              error={errors.cli_apellido}
              required
              placeholder="Perez"
            />

            <FormInput
              label="Email"
              name="cli_email"
              type="email"
              value={formData.cli_email}
              onChange={handleChange}
              error={errors.cli_email}
              required
              placeholder="cliente@email.com"
            />

            <FormInput
              label="Telefono"
              name="cli_telefono"
              type="tel"
              value={formData.cli_telefono}
              onChange={handleChange}
              error={errors.cli_telefono}
              required
              placeholder="987654321"
              maxLength={9}
            />

            <div className="md:col-span-2">
              <FormInput
                label="Direccion"
                name="cli_direccion"
                type="text"
                value={formData.cli_direccion}
                onChange={handleChange}
                error={errors.cli_direccion}
                required
                placeholder="Av. Principal 123, Lima"
              />
            </div>
            <div>
              <label
                htmlFor="cli_fecha_nac"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Fecha de Nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                id="cli_fecha_nac"
                name="cli_fecha_nac"
                type="date"
                value={formData.cli_fecha_nac || ''}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {errors.cli_fecha_nac && (
                <p className="mt-1 text-sm text-red-500">{errors.cli_fecha_nac}</p>
              )}
            </div>


            <FormInput
              label="Codigo Sucursal"
              name="cli_ciudad"
              type="number"
              value={formData.cli_ciudad.toString()}
              onChange={handleChange}
              error={errors.cli_ciudad}
              required
              placeholder="1"
            />

          </div>

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

export default ClienteForm;