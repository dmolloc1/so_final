import React, { useState, useEffect } from "react";
import type { User } from "../../../../auth/types/user";
import type { Role, RolNombre, RolEstado, RolNivel } from "../../../../auth/types/user";
import { Lock, Unlock } from "lucide-react";
import Select from "react-select";
import type { MultiValue } from "react-select";
import { getBranches } from "../../../../services/branchService";
import type { Branch } from "../../../../types/branch";
//nUEVO CAMBIO SUPERVISORES NO LE PUEDEN CAMBIAR SUCURSAL AL USUARIO, , ya corregida

/* Formulario hecho para crear usuario y editarlo */
interface UserFormProps {
  isOpen: boolean;
  user?: User | null;
  onClose: () => void;
  onSubmit: (user: User) => Promise<void>;
  mode: "create" | "edit";
  isManager: boolean;
}
interface FormErrors {
  usuNom?: string;
  password?: string;
  usuNombreCom?: string;
  usuDNI?: string;
  usuTel?: string;
  usuEmail?: string;
  roles?: string;
}

const UsersForm: React.FC<UserFormProps> = ({ isOpen, user, onClose, onSubmit, mode, isManager}) => {
  const initialState: User = {
    usuNom: "",
    password: "",
    usuNombreCom: "",
    usuDNI: "",
    usuTel: "",
    usuEmail: "",
    usuEstado: true,
    roles: [],
    sucurCod: undefined,
  };

  const [formData, setFormData] = useState<User>(user ?? initialState);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [label, setlabel] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showFields, setShowFields] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [roleOptions] = useState<Role[]>([
    { rolCod: 1, rolNom: "GERENTE", rolDes: "ADMIN", rolEstado: "ACTIVO", rolNivel: 0 },
    { rolCod: 2, rolNom: "CAJERO", rolDes: "Caja", rolEstado: "ACTIVO", rolNivel: 1 },
    { rolCod: 3, rolNom: "VENDEDOR", rolDes: "Ventas", rolEstado: "ACTIVO", rolNivel: 1 },
    { rolCod: 4, rolNom: "OPTOMETRA", rolDes: "Óptica", rolEstado: "ACTIVO", rolNivel: 1 },
    { rolCod: 5, rolNom: "SUPERVISOR", rolDes: "Gerencia", rolEstado: "ACTIVO", rolNivel: 1 },
    { rolCod: 6, rolNom: "LOGISTICA", rolDes: "Inventario", rolEstado: "ACTIVO", rolNivel: 1 },
  ]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await getBranches();
        setBranches(data);
      } catch (error) {
        console.error("Error al cargar sucursales:", error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (user && mode === "edit") {
      const normalizedRoles = (user.roles ?? []).map((r) => {
        const found = roleOptions.find((opt) => opt.rolNom === r.rolNom);
        return { ...r, rolCod: found ? found.rolCod : r.rolCod ?? 0 };
      });
      setFormData({ ...user, roles: normalizedRoles });
      setlabel("Editar Usuario");
    } else {
      setFormData(initialState);
      setlabel("Crear Usuario");
    }
    setErrors({});
    setBackendError(null);
  }, [user, mode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!(formData.usuNom ?? "").trim()) newErrors.usuNom = "El nombre de usuario es obligatorio";
    if (mode === "create" && !(formData.password ?? "").trim())
      newErrors.password = "La contraseña es obligatoria";
    if (!(formData.usuNombreCom ?? "").trim())
      newErrors.usuNombreCom = "El nombre completo es obligatorio";
    if (!(formData.usuDNI ?? "").trim()) newErrors.usuDNI = "El DNI es obligatorio";
    else if (!/^\d{8}$/.test(formData.usuDNI ?? ""))
      newErrors.usuDNI = "El DNI debe tener 8 dígitos";
    if (!(formData.usuTel ?? "").trim()) newErrors.usuTel = "El teléfono es obligatorio";
    else if (!/^\d{9}$/.test(formData.usuTel ?? ""))
      newErrors.usuTel = "El teléfono debe tener 9 dígitos";
    if (!(formData.usuEmail ?? "").trim()) newErrors.usuEmail = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.usuEmail ?? ""))
      newErrors.usuEmail = "El email no es válido";
    if (!formData.roles || formData.roles.length === 0)
      newErrors.roles = "Debe asignar al menos un rol";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (showFields && newPassword !== repeatPassword) {
      setErrors((prev) => ({ ...prev, password: "Las contraseñas no coinciden" }));
      return;
    }

    setIsSubmitting(true);
    setBackendError(null);

    try {
      await onSubmit({
        ...formData,
        ...(showFields && newPassword ? { password: newPassword } : {}),
      });
      handleClose();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      setBackendError("Error al guardar el usuario. Verifica los datos.");
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
    <div
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 relative"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          {label}
        </h1>

        {backendError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4 text-sm">
            {backendError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Usuario */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Usuario</label>
            <input
              name="usuNom"
              type="text"
              value={formData.usuNom}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="usuario123"
            />
            {errors.usuNom && <p className="text-red-500 text-xs mt-1">{errors.usuNom}</p>}
          </div>

          {/* Contraseña */}
          {mode === "create" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          )}

          {/* Nombre completo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              name="usuNombreCom"
              type="text"
              value={formData.usuNombreCom}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Juan Pérez"
            />
            {errors.usuNombreCom && (
              <p className="text-red-500 text-xs mt-1">{errors.usuNombreCom}</p>
            )}
          </div>

          {/* DNI */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">DNI</label>
            <input
              name="usuDNI"
              type="text"
              value={formData.usuDNI}
              onChange={handleChange}
              maxLength={8}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="00000000"
            />
            {errors.usuDNI && <p className="text-red-500 text-xs mt-1">{errors.usuDNI}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
            <input
              name="usuTel"
              type="tel"
              value={formData.usuTel}
              onChange={handleChange}
              maxLength={9}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="987654321"
            />
            {errors.usuTel && <p className="text-red-500 text-xs mt-1">{errors.usuTel}</p>}
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              name="usuEmail"
              type="email"
              value={formData.usuEmail}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="usuario@correo.com"
            />
            {errors.usuEmail && <p className="text-red-500 text-xs mt-1">{errors.usuEmail}</p>}
          </div>
          {/* Sucursales*/}
          {isManager &&(
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Sucursal Asignada
              </label>
              <select
                name="sucurCod"
                value={formData.sucurCod ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  setFormData((prev) => ({ ...prev, sucurCod: value }));
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                <option value="">Sin asignar</option>
                {branches.map((branch) => (
                  <option key={branch.sucurCod} value={branch.sucurCod}>
                    {branch.sucurNom}
                  </option>
                ))}
              </select>
            </div>
          )}


          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
            <select
              name="usuEstado"
              value={formData.usuEstado ? "Active" : "Inactive"}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="Active">Activo</option>
              <option value="Inactive">Inactivo</option>
            </select>
          </div>

          {/* Roles */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Roles</label>
            <Select
              isMulti
              options={roleOptions.map((r) => ({ value: r.rolCod, label: r.rolNom }))}
              value={(formData.roles ?? []).map((r) => ({
                value: r.rolCod,
                label: r.rolNom,
              }))}
              onChange={(selected) => {
                const newRoles = (selected as MultiValue<{ value: number; label: string }>).map(
                  (s) => ({
                    rolCod: s.value,
                    rolNom: s.label as RolNombre,
                    rolDes: "",
                    rolEstado: "ACTIVO" as RolEstado,
                    rolNivel: 1 as RolNivel,
                  })
                );
                setFormData((prev) => ({ ...prev, roles: newRoles }));
              }}
              className="text-sm"
            />
            {errors.roles && <p className="text-red-500 text-xs mt-1">{errors.roles}</p>}
            {formData.roles.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                Seleccionados: {formData.roles.map((r) => r.rolNom).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col md:flex-row justify-end gap-4 mt-8 border-t pt-6">
          {mode === "edit" && (
            <button
              type="button"
              onClick={() => setShowFields((prev) => !prev)}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              {showFields ? <Unlock size={20} /> : <Lock size={20} />}
              Cambiar contraseña
            </button>
          )}

          {showFields && (
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="password"
                placeholder="Repite contraseña"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 md:mt-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 border border-gray-300 font-semibold rounded-lg text-gray-700 hover:bg-gray-100 transition"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : mode === "create" ? "Agregar" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UsersForm;