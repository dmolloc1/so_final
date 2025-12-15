  // BranchManagement/BranchesForm.tsx
  import React, { useState, useEffect } from 'react';
  import Modal from '../../../../components/Modal/modal';
  import FormInput from '../../../../components/Forms/FormInput';
  import type { Branch, DEPARTAMENTO_CHOICES } from '../../../../types/branch';


  interface BranchesFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (branch: Omit<Branch, 'sucurCod'> | Branch) => Promise<void>;
    branch?: Branch | null;
    mode: 'create' | 'edit';
  }

  interface FormErrors {
    sucurNom?: string;
    sucurDep?: string;
    sucurCiu?: string;
    sucurDis?: string;
    sucurDir?: string;
    sucurTel?: string;
  }

  // Lista de departamentos del Perú
  const DEPARTAMENTOS: { value: DEPARTAMENTO_CHOICES; label: string }[] = [
    { value: 'AMAZONAS', label: 'Amazonas' },
    { value: 'ANCASH', label: 'Áncash' },
    { value: 'APURIMAC', label: 'Apurímac' },
    { value: 'AREQUIPA', label: 'Arequipa' },
    { value: 'AYACUCHO', label: 'Ayacucho' },
    { value: 'CAJAMARCA', label: 'Cajamarca' },
    { value: 'CALLAO', label: 'Callao' },
    { value: 'CUSCO', label: 'Cusco' },
    { value: 'HUANCAVELICA', label: 'Huancavelica' },
    { value: 'HUANUCO', label: 'Huánuco' },
    { value: 'ICA', label: 'Ica' },
    { value: 'JUNIN', label: 'Junín' },
    { value: 'LA_LIBERTAD', label: 'La Libertad' },
    { value: 'LAMBAYEQUE', label: 'Lambayeque' },
    { value: 'LIMA', label: 'Lima' },
    { value: 'LORETO', label: 'Loreto' },
    { value: 'MADRE_DE_DIOS', label: 'Madre de Dios' },
    { value: 'MOQUEGUA', label: 'Moquegua' },
    { value: 'PASCO', label: 'Pasco' },
    { value: 'PIURA', label: 'Piura' },
    { value: 'PUNO', label: 'Puno' },
    { value: 'SAN_MARTIN', label: 'San Martín' },
    { value: 'TACNA', label: 'Tacna' },
    { value: 'TUMBES', label: 'Tumbes' },
    { value: 'UCAYALI', label: 'Ucayali' }
  ];

  const BranchesForm: React.FC<BranchesFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    branch,
    mode
  }) => {
    const initialState: Omit<Branch, 'sucurCod'> = {
      sucurNom: '',
      sucurDep: 'LIMA',
      sucurCiu: '',
      sucurDis: '',
      sucurDir: '',
      sucurTel: '',
      sucurEstado: 'Active'
    };

    const [formData, setFormData] = useState<Omit<Branch, 'sucurCod'> | Branch>(initialState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    //Nuevo: Formulario central para asignar cajas por defecto en la sucursal del usuario (cargan todos los usuario)
   

    useEffect(() => {


      if (branch && mode === 'edit') {
        setFormData(branch);
      } else {
        setFormData(initialState);
      }
      setErrors({});
      setBackendError(null);
    }, [branch, mode, isOpen]);


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

      // Validar Nombre de Sucursal
      if (!formData.sucurNom.trim()) {
        newErrors.sucurNom = 'El nombre de la sucursal es obligatorio';
      } else if (formData.sucurNom.length < 3) {
        newErrors.sucurNom = 'El nombre debe tener al menos 3 caracteres';
      }

      // Validar Ciudad
      if (!formData.sucurCiu.trim()) {
        newErrors.sucurCiu = 'La ciudad es obligatoria';
      }

      // Validar Distrito
      if (!formData.sucurDis.trim()) {
        newErrors.sucurDis = 'El distrito es obligatorio';
      }

      // Validar Dirección
      if (!formData.sucurDir.trim()) {
        newErrors.sucurDir = 'La dirección es obligatoria';
      }

      // Validar Teléfono (9 dígitos)
      if (!formData.sucurTel.trim()) {
        newErrors.sucurTel = 'El teléfono es obligatorio';
      } else if (!/^\d{9}$/.test(formData.sucurTel)) {
        newErrors.sucurTel = 'El teléfono debe tener 9 dígitos';
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
        if (error.sucurNom) {
          setErrors(prev => ({ ...prev, sucurNom: error.sucurNom[0] }));
        }
        if (error.sucurTel) {
          setErrors(prev => ({ ...prev, sucurTel: error.sucurTel[0] }));
        }
        if (error.sucurDir) {
          setErrors(prev => ({ ...prev, sucurDir: error.sucurDir[0] }));
        }
        
        setBackendError('Error al guardar la sucursal. Por favor, verifica los datos.');
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
        title={mode === 'create' ? 'Agregar Sucursal' : 'Editar Sucursal'}
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
            
            {/* Nombre de Sucursal */}
            <div className="md:col-span-2">
              <FormInput
                label="Nombre de Sucursal"
                name="sucurNom"
                type="text"
                value={formData.sucurNom}
                onChange={handleChange}
                error={errors.sucurNom}
                required
                placeholder="Sucursal Centro"
              />
            </div>

            {/* Departamento */}
            <div className="mb-4">
              <label 
                htmlFor="sucurDep" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Departamento <span className="text-red-500">*</span>
              </label>
              <select
                id="sucurDep"
                name="sucurDep"
                value={formData.sucurDep}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {DEPARTAMENTOS.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
              {errors.sucurDep && (
                <p className="mt-1 text-sm text-red-600">{errors.sucurDep}</p>
              )}
            </div>

            {/* Ciudad */}
            <FormInput
              label="Ciudad"
              name="sucurCiu"
              type="text"
              value={formData.sucurCiu}
              onChange={handleChange}
              error={errors.sucurCiu}
              required
              placeholder="Arequipa"
            />

            {/* Distrito */}
            <FormInput
              label="Distrito"
              name="sucurDis"
              type="text"
              value={formData.sucurDis}
              onChange={handleChange}
              error={errors.sucurDis}
              required
              placeholder="Cercado"
            />

            {/* Teléfono */}
            <FormInput
              label="Teléfono"
              name="sucurTel"
              type="tel"
              value={formData.sucurTel}
              onChange={handleChange}
              error={errors.sucurTel}
              required
              placeholder="987654321"
              maxLength={9}
            />

            {/* Dirección */}
            <div className="md:col-span-2">
              <FormInput
                label="Dirección"
                name="sucurDir"
                type="text"
                value={formData.sucurDir}
                onChange={handleChange}
                error={errors.sucurDir}
                required
                placeholder="Av. Principal 123"
              />
            </div>

            {/* Estado */}
            <div className="mb-4">
              <label 
                htmlFor="sucurEstado" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                id="sucurEstado"
                name="sucurEstado"
                value={formData.sucurEstado}
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

  export default BranchesForm;