"use client";

import React, { useState, useEffect } from "react";
import Modal from "../../../../components/Modal/modal";
import FormInput from "../../../../components/Forms/FormInput";
import api from "../../../../auth/services/api";
import type { Client } from "../../../../services/clientService";
import type { Recipe } from "../../../../types/recipe";
import { useAuth } from "../../../../auth/hooks/useAuth";
import { notifyError, notifyWarning } from "../../../../shared/notifications";

interface RecipeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Recipe>) => Promise<void>;
  editingRecipe?: Recipe | null;
  clienteSeleccionado?: Client | null;
}

interface FormErrors {
  tipoDoc?: string;
  dni?: string;
  recTipoLente?: string;
  dpGeneral?: string;
  lejos_od_esf?: string;
  lejos_od_cil?: string;
  lejos_od_eje?: string;
  lejos_od_avcc?: string;
  lejos_od_dip?: string;
  lejos_oi_esf?: string;
  lejos_oi_cil?: string;
  lejos_oi_eje?: string;
  lejos_oi_avcc?: string;
  lejos_oi_dip?: string;
  cerca_od_esf?: string;
  cerca_od_cil?: string;
  cerca_od_eje?: string;
  cerca_od_add?: string;
  cerca_oi_esf?: string;
  cerca_oi_cil?: string;
  cerca_oi_eje?: string;
  cerca_oi_add?: string;
}

export default function RecipeForm({
  isOpen,
  onClose,
  onSubmit,
  editingRecipe,
  clienteSeleccionado,
}: RecipeFormProps) {
  const { user } = useAuth();
  const [paciente, setPaciente] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    dni: "",
    tipoDoc: "DNI",
    nombre: "",
    fecha_nac: "",
    telefono: "",
    recTipoLente: "Mixto",
    dpGeneral: "",
    
    // Lejos OD
    lejos_od_esf: "",
    lejos_od_cil: "",
    lejos_od_eje: "",
    lejos_od_avcc: "",
    lejos_od_dip: "",
    
    // Lejos OI
    lejos_oi_esf: "",
    lejos_oi_cil: "",
    lejos_oi_eje: "",
    lejos_oi_avcc: "",
    lejos_oi_dip: "",
    
    // Cerca OD
    cerca_od_esf: "",
    cerca_od_cil: "",
    cerca_od_eje: "",
    cerca_od_add: "",
    
    // Cerca OI
    cerca_oi_esf: "",
    cerca_oi_cil: "",
    cerca_oi_eje: "",
    cerca_oi_add: "",
    
    diagnostico: [] as string[],
    observaciones: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Cargar datos si está editando
  useEffect(() => {
    if (editingRecipe) {
      setFormData({
        dni: editingRecipe.cliente_documento || "",
        tipoDoc: editingRecipe.cliente_tipo_doc || "DNI",
        nombre: editingRecipe.cliente_nombre || "",
        fecha_nac: "",
        telefono: "",
        recTipoLente: editingRecipe.recTipoLente || "Mixto",
        dpGeneral: editingRecipe.dpGeneral?.toString() || "",
        
        lejos_od_esf: editingRecipe.lejos_od_esf?.toString() || "",
        lejos_od_cil: editingRecipe.lejos_od_cil?.toString() || "",
        lejos_od_eje: editingRecipe.lejos_od_eje?.toString() || "",
        lejos_od_avcc: editingRecipe.lejos_od_avcc?.toString() || "",
        lejos_od_dip: editingRecipe.lejos_od_dip?.toString() || "",
        
        lejos_oi_esf: editingRecipe.lejos_oi_esf?.toString() || "",
        lejos_oi_cil: editingRecipe.lejos_oi_cil?.toString() || "",
        lejos_oi_eje: editingRecipe.lejos_oi_eje?.toString() || "",
        lejos_oi_avcc: editingRecipe.lejos_oi_avcc?.toString() || "",
        lejos_oi_dip: editingRecipe.lejos_oi_dip?.toString() || "",
        
        cerca_od_esf: editingRecipe.cerca_od_esf?.toString() || "",
        cerca_od_cil: editingRecipe.cerca_od_cil?.toString() || "",
        cerca_od_eje: editingRecipe.cerca_od_eje?.toString() || "",
        cerca_od_add: editingRecipe.cerca_od_add?.toString() || "",
        
        cerca_oi_esf: editingRecipe.cerca_oi_esf?.toString() || "",
        cerca_oi_cil: editingRecipe.cerca_oi_cil?.toString() || "",
        cerca_oi_eje: editingRecipe.cerca_oi_eje?.toString() || "",
        cerca_oi_add: editingRecipe.cerca_oi_add?.toString() || "",
        
        diagnostico: Array.isArray(editingRecipe.diagnostico) ? editingRecipe.diagnostico : [],
        observaciones: editingRecipe.recObservaciones || "",
      });
    }
  }, [editingRecipe]);

  // Cargar cliente preseleccionado
  useEffect(() => {
    if (clienteSeleccionado) {
      setPaciente(clienteSeleccionado);
      
      // Mapeo de campos antiguos y nuevos para mayor compatibilidad
      const nombre = clienteSeleccionado.cli_nombre || clienteSeleccionado.cliNombre || "";
      const apellido = clienteSeleccionado.cli_apellido || clienteSeleccionado.cliApellido || "";
      const numDoc = clienteSeleccionado.cli_num_doc || clienteSeleccionado.cliNumDoc || "";
      const tipoDoc = clienteSeleccionado.cli_tipo_doc || clienteSeleccionado.cliTipoDoc || "DNI";
      const fechaNac = clienteSeleccionado.cli_fecha_nac || clienteSeleccionado.cliFechaNac || "";
      const telefono = clienteSeleccionado.cli_telefono || clienteSeleccionado.cliTelefono || "";
      
      setFormData((prev) => ({
        ...prev,
        dni: numDoc,
        tipoDoc: tipoDoc,
        nombre: `${nombre} ${apellido}`.trim(),
        fecha_nac: fechaNac?.split("T")[0] || "",
        telefono: telefono,
      }));
    }
  }, [clienteSeleccionado]);

  const isValidNumber = (value: string) => /^-?\d+(\.\d+)?$/.test(value);

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!formData.tipoDoc) {
      newErrors.tipoDoc = "El tipo de documento es obligatorio.";
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El número de documento es obligatorio.";
    } else if (formData.tipoDoc === "DNI") {
      if (!/^\d{8}$/.test(formData.dni)) {
        newErrors.dni = "El DNI debe tener 8 dígitos.";
      }
    } else if (formData.tipoDoc === "CE") {
      if (!/^[A-Z0-9]{9,12}$/i.test(formData.dni)) {
        newErrors.dni = "El Carnet debe tener entre 9 y 12 caracteres alfanuméricos.";
      }
    }

    if (!formData.recTipoLente.trim()) {
      newErrors.recTipoLente = "El tipo de lente es obligatorio.";
    }

    if (formData.dpGeneral && !isValidNumber(formData.dpGeneral)) {
      newErrors.dpGeneral = "La distancia pupilar debe ser un número.";
    }

    const numericFields: Array<{ key: keyof FormErrors; value: string; label: string }> = [
      { key: "lejos_od_esf", value: formData.lejos_od_esf, label: "Lejos OD ESF" },
      { key: "lejos_od_cil", value: formData.lejos_od_cil, label: "Lejos OD CIL" },
      { key: "lejos_od_eje", value: formData.lejos_od_eje, label: "Lejos OD EJE" },
      { key: "lejos_od_avcc", value: formData.lejos_od_avcc, label: "Lejos OD AVCC" },
      { key: "lejos_od_dip", value: formData.lejos_od_dip, label: "Lejos OD DIP" },
      { key: "lejos_oi_esf", value: formData.lejos_oi_esf, label: "Lejos OI ESF" },
      { key: "lejos_oi_cil", value: formData.lejos_oi_cil, label: "Lejos OI CIL" },
      { key: "lejos_oi_eje", value: formData.lejos_oi_eje, label: "Lejos OI EJE" },
      { key: "lejos_oi_avcc", value: formData.lejos_oi_avcc, label: "Lejos OI AVCC" },
      { key: "lejos_oi_dip", value: formData.lejos_oi_dip, label: "Lejos OI DIP" },
      { key: "cerca_od_esf", value: formData.cerca_od_esf, label: "Cerca OD ESF" },
      { key: "cerca_od_cil", value: formData.cerca_od_cil, label: "Cerca OD CIL" },
      { key: "cerca_od_eje", value: formData.cerca_od_eje, label: "Cerca OD EJE" },
      { key: "cerca_od_add", value: formData.cerca_od_add, label: "Cerca OD ADD" },
      { key: "cerca_oi_esf", value: formData.cerca_oi_esf, label: "Cerca OI ESF" },
      { key: "cerca_oi_cil", value: formData.cerca_oi_cil, label: "Cerca OI CIL" },
      { key: "cerca_oi_eje", value: formData.cerca_oi_eje, label: "Cerca OI EJE" },
      { key: "cerca_oi_add", value: formData.cerca_oi_add, label: "Cerca OI ADD" },
    ];

    numericFields.forEach(({ key, value, label }) => {
      if (!value.trim()) return;
      if (!isValidNumber(value)) {
        newErrors[key] = `${label} solo admite números`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buscarPaciente = async () => {
    const docValue = formData.dni.trim();
    const isDni = formData.tipoDoc === "DNI";

    if (isDni && !/^\d{8}$/.test(docValue)) {
      notifyError("DNI no válido");
      return;
    }

    if (!isDni && !/^[A-Z0-9]{9,12}$/i.test(docValue)) {
      notifyError("Carnet de extranjería no válido");
      return;
    }

    try {
      const response = await api.get("/clients/", {
        params: { search: docValue, tipo_doc: formData.tipoDoc },
      });

      const data = response.data?.results || response.data?.data || response.data;

      if (!Array.isArray(data) || data.length === 0) {
        notifyWarning("Cliente no encontrado");
        setPaciente(null);
        return;
      }

      const cli = data[0];
      
      // DEBUG: Ver estructura exacta del cliente
      console.log("=== CLIENTE ENCONTRADO ===");
      console.log("Objeto completo:", cli);
      console.log("Campos disponibles:", Object.keys(cli));
      
      setPaciente(cli);
      
      // Probar múltiples variaciones de nombres de campos
      const nombre = cli.cliNombre || cli.cli_nombre || cli.nombre || "";
      const apellido = cli.cliApellido || cli.cli_apellido || cli.apellido || "";
      const fechaNac = cli.cliFechaNac || cli.cli_fecha_nac || cli.fecha_nac || cli.fechaNac || "";
      const telefono = cli.cliTelefono || cli.cli_telefono || cli.telefono || "";
      
      console.log("Valores mapeados:");
      console.log("  nombre:", nombre);
      console.log("  apellido:", apellido);
      console.log("  fechaNac:", fechaNac);
      console.log("  telefono:", telefono);
      console.log("========================");
      
      setFormData((prev) => ({
        ...prev,
        nombre: `${nombre} ${apellido}`.trim(),
        fecha_nac: fechaNac?.split("T")[0] || "",
        telefono: telefono || "",
      }));
    } catch (error) {
      console.error("Error al buscar cliente:", error);
      notifyError("Error al buscar cliente");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const toggleDiagnostico = (d: string) => {
    setFormData((p) => {
      const exists = p.diagnostico.includes(d);
      return {
        ...p,
        diagnostico: exists
          ? p.diagnostico.filter((x) => x !== d)
          : [...p.diagnostico, d],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      notifyError("Revisa los campos marcados en rojo.");
      return;
    }

    if (!paciente && !editingRecipe) {
      notifyWarning("Debe seleccionar un paciente válido");
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Recipe> = {
        cliente: paciente?.cli_cod || editingRecipe?.cliente || 0,
        recTipoLente: formData.recTipoLente,
        recEstado: "Activo",
        recObservaciones: formData.observaciones || undefined,
        dpGeneral: formData.dpGeneral ? parseFloat(formData.dpGeneral) : null,
        
        lejos_od_esf: formData.lejos_od_esf ? parseFloat(formData.lejos_od_esf) : null,
        lejos_od_cil: formData.lejos_od_cil ? parseFloat(formData.lejos_od_cil) : null,
        lejos_od_eje: formData.lejos_od_eje ? parseInt(formData.lejos_od_eje) : null,
        lejos_od_avcc: formData.lejos_od_avcc ? parseFloat(formData.lejos_od_avcc) : null,
        lejos_od_dip: formData.lejos_od_dip ? parseFloat(formData.lejos_od_dip) : null,
        
        lejos_oi_esf: formData.lejos_oi_esf ? parseFloat(formData.lejos_oi_esf) : null,
        lejos_oi_cil: formData.lejos_oi_cil ? parseFloat(formData.lejos_oi_cil) : null,
        lejos_oi_eje: formData.lejos_oi_eje ? parseInt(formData.lejos_oi_eje) : null,
        lejos_oi_avcc: formData.lejos_oi_avcc ? parseFloat(formData.lejos_oi_avcc) : null,
        lejos_oi_dip: formData.lejos_oi_dip ? parseFloat(formData.lejos_oi_dip) : null,
        
        cerca_od_esf: formData.cerca_od_esf ? parseFloat(formData.cerca_od_esf) : null,
        cerca_od_cil: formData.cerca_od_cil ? parseFloat(formData.cerca_od_cil) : null,
        cerca_od_eje: formData.cerca_od_eje ? parseInt(formData.cerca_od_eje) : null,
        cerca_od_add: formData.cerca_od_add ? parseFloat(formData.cerca_od_add) : null,
        
        cerca_oi_esf: formData.cerca_oi_esf ? parseFloat(formData.cerca_oi_esf) : null,
        cerca_oi_cil: formData.cerca_oi_cil ? parseFloat(formData.cerca_oi_cil) : null,
        cerca_oi_eje: formData.cerca_oi_eje ? parseInt(formData.cerca_oi_eje) : null,
        cerca_oi_add: formData.cerca_oi_add ? parseFloat(formData.cerca_oi_add) : null,
        
        diagnostico: formData.diagnostico,
      };

      await onSubmit(payload);
      handleClose();
    } catch (err) {
      console.error("Error guardando receta:", err);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setPaciente(null);
    setFormData({
      dni: "",
      tipoDoc: "DNI",
      nombre: "",
      fecha_nac: "",
      telefono: "",
      recTipoLente: "Mixto",
      dpGeneral: "",
      lejos_od_esf: "",
      lejos_od_cil: "",
      lejos_od_eje: "",
      lejos_od_avcc: "",
      lejos_od_dip: "",
      lejos_oi_esf: "",
      lejos_oi_cil: "",
      lejos_oi_eje: "",
      lejos_oi_avcc: "",
      lejos_oi_dip: "",
      cerca_od_esf: "",
      cerca_od_cil: "",
      cerca_od_eje: "",
      cerca_od_add: "",
      cerca_oi_esf: "",
      cerca_oi_cil: "",
      cerca_oi_eje: "",
      cerca_oi_add: "",
      diagnostico: [],
      observaciones: "",
    });
    setErrors({});
    onClose();
  };

  const calcularEdad = (fecha: string) => {
    if (!fecha) return "";
    const nacimiento = new Date(fecha);
    return new Date().getFullYear() - nacimiento.getFullYear();
  };

  const optometraPorDefecto = {
    nombre: "Dr. Viddes Maqueyra Velarde",
    cargo: "Médico Oftalmólogo",
    cmp: "41792",
    rne: "31403",
  };

  const esOptometraActivo = user?.roles?.some((rol: any) => rol.rolNom === "OPTOMETRA");

  const datosOptometra = {
    nombre: esOptometraActivo && user?.usuNombreCom ? user.usuNombreCom : optometraPorDefecto.nombre,
    cargo: esOptometraActivo && user?.optometra?.optCargo ? user.optometra.optCargo : optometraPorDefecto.cargo,
    cmp: esOptometraActivo && user?.optometra?.optCMP ? user.optometra.optCMP : optometraPorDefecto.cmp,
    rne: esOptometraActivo && user?.optometra?.optRNE ? user.optometra.optRNE : optometraPorDefecto.rne,
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editingRecipe ? "Editar Receta" : "Nueva Receta"} size="xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
          {/* DATOS DEL PACIENTE */}
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">Datos del Paciente</h2>
            
            <div className="grid grid-cols-[110px,1fr,auto] gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  name="tipoDoc"
                  value={formData.tipoDoc}
                  onChange={handleChange}
                  disabled={!!editingRecipe}
                  className={`w-full h-11 border rounded-lg px-2 ${errors.tipoDoc ? "border-red-500" : ""}`}
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">Carnet de extranjería</option>
                </select>
                {errors.tipoDoc && <p className="mt-1 text-xs text-red-500">{errors.tipoDoc}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documento del Paciente<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  maxLength={formData.tipoDoc === "DNI" ? 8 : 12}
                  required
                  disabled={!!editingRecipe}
                  className={`w-full h-11 px-4 border rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dni ? "border-red-500" : ""
                  }`}
                />
                {errors.dni && <p className="mt-1 text-xs text-red-500">{errors.dni}</p>}
              </div>

              {!editingRecipe && (
                <button
                  type="button"
                  onClick={buscarPaciente}
                  className="h-11 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Buscar
                </button>
              )}
            </div>

            <FormInput
              label="Nombres y Apellidos"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              disabled
            />
            <FormInput
              label="Fecha de Nacimiento"
              name="fecha_nac"
              type="date"
              value={formData.fecha_nac}
              onChange={handleChange}
              disabled
            />
            <FormInput
              label="Número de Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              disabled
            />
          </div>

          {/* MEDICIÓN DE VISTA */}
          <div>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">Medición de Vista</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <FormInput
                label="Tipo de lente"
                name="recTipoLente"
                value={formData.recTipoLente}
                onChange={handleChange}
                placeholder="Mixto"
                error={errors.recTipoLente}
              />
              <FormInput
                label="Distancia Pupilar"
                name="dpGeneral"
                value={formData.dpGeneral}
                onChange={handleChange}
                placeholder="DIP"
                error={errors.dpGeneral}
              />
            </div>

            {/* LEJOS */}
            <fieldset className="border p-3 rounded-lg mb-4">
              <legend className="text-gray-500">Lejos</legend>
              
              {/* OD */}
              <div className="grid grid-cols-6 gap-2 items-center mt-2">
                <span className="font-semibold col-span-1">OD</span>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_od_esf ? "border-red-500" : ""}`}
                    name="lejos_od_esf"
                    placeholder="ESF"
                    value={formData.lejos_od_esf}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.lejos_od_esf && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_od_esf}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_od_cil ? "border-red-500" : ""}`}
                    name="lejos_od_cil"
                    placeholder="CIL"
                    value={formData.lejos_od_cil}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.lejos_od_cil && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_od_cil}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_od_eje ? "border-red-500" : ""}`}
                    name="lejos_od_eje"
                    placeholder="EJE"
                    value={formData.lejos_od_eje}
                    onChange={handleChange}
                    inputMode="numeric"
                  />
                  {errors.lejos_od_eje && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_od_eje}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_od_avcc ? "border-red-500" : ""}`}
                    name="lejos_od_avcc"
                    placeholder="AVCC"
                    value={formData.lejos_od_avcc}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.lejos_od_avcc && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_od_avcc}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_od_dip ? "border-red-500" : ""}`}
                    name="lejos_od_dip"
                    placeholder="DIP"
                    value={formData.lejos_od_dip}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.lejos_od_dip && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_od_dip}</p>}
                </div>
              </div>

              {/* OI */}
              <div className="grid grid-cols-6 gap-2 items-center mt-2">
                <span className="font-semibold col-span-1">OI</span>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_oi_esf ? "border-red-500" : ""}`}
                    name="lejos_oi_esf"
                    placeholder="ESF"
                    value={formData.lejos_oi_esf}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.lejos_oi_esf && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_oi_esf}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_oi_cil ? "border-red-500" : ""}`}
                    name="lejos_oi_cil"
                    placeholder="CIL"
                    value={formData.lejos_oi_cil}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.lejos_oi_cil && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_oi_cil}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_oi_eje ? "border-red-500" : ""}`}
                    name="lejos_oi_eje"
                    placeholder="EJE"
                    value={formData.lejos_oi_eje}
                    onChange={handleChange}
                    inputMode="numeric"
                  />
                  {errors.lejos_oi_eje && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_oi_eje}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_oi_avcc ? "border-red-500" : ""}`}
                    name="lejos_oi_avcc"
                    placeholder="AVCC"
                    value={formData.lejos_oi_avcc}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.lejos_oi_avcc && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_oi_avcc}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.lejos_oi_dip ? "border-red-500" : ""}`}
                    name="lejos_oi_dip"
                    placeholder="DIP"
                    value={formData.lejos_oi_dip}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.lejos_oi_dip && <p className="mt-1 text-[10px] text-red-500">{errors.lejos_oi_dip}</p>}
                </div>
              </div>
            </fieldset>

            {/* CERCA */}
            <fieldset className="border p-3 rounded-lg">
              <legend className="text-gray-500">Cerca</legend>
              
              {/* OD */}
              <div className="grid grid-cols-5 gap-2 items-center mt-2">
                <span className="font-semibold col-span-1">OD</span>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.cerca_od_esf ? "border-red-500" : ""}`}
                    name="cerca_od_esf"
                    placeholder="ESF"
                    value={formData.cerca_od_esf}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.cerca_od_esf && <p className="mt-1 text-[10px] text-red-500">{errors.cerca_od_esf}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.cerca_od_cil ? "border-red-500" : ""}`}
                    name="cerca_od_cil"
                    placeholder="CIL"
                    value={formData.cerca_od_cil}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.cerca_od_cil && <p className="mt-1 text-[10px] text-red-500">{errors.cerca_od_cil}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.cerca_od_eje ? "border-red-500" : ""}`}
                    name="cerca_od_eje"
                    placeholder="EJE"
                    value={formData.cerca_od_eje}
                    onChange={handleChange}
                    inputMode="numeric"
                  />
                  {errors.cerca_od_eje && <p className="mt-1 text-[10px] text-red-500">{errors.cerca_od_eje}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.cerca_od_add ? "border-red-500" : ""}`}
                    name="cerca_od_add"
                    placeholder="ADD"
                    value={formData.cerca_od_add}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.cerca_od_add && <p className="mt-1 text-[10px] text-red-500">{errors.cerca_od_add}</p>}
                </div>
              </div>

              {/* OI */}
              <div className="grid grid-cols-5 gap-2 items-center mt-2">
                <span className="font-semibold col-span-1">OI</span>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.cerca_oi_esf ? "border-red-500" : ""}`}
                    name="cerca_oi_esf"
                    placeholder="ESF"
                    value={formData.cerca_oi_esf}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.cerca_oi_esf && <p className="mt-1 text-[10px] text-red-500">{errors.cerca_oi_esf}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.cerca_oi_cil ? "border-red-500" : ""}`}
                    name="cerca_oi_cil"
                    placeholder="CIL"
                    value={formData.cerca_oi_cil}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.cerca_oi_cil && <p className="mt-1 text-[10px] text-red-500">{errors.cerca_oi_cil}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.cerca_oi_eje ? "border-red-500" : ""}`}
                    name="cerca_oi_eje"
                    placeholder="EJE"
                    value={formData.cerca_oi_eje}
                    onChange={handleChange}
                    inputMode="numeric"
                  />
                  {errors.cerca_oi_eje && <p className="mt-1 text-[10px] text-red-500">{errors.cerca_oi_eje}</p>}
                </div>
                <div>
                  <input
                    className={`border p-2 rounded text-center w-full ${errors.cerca_oi_add ? "border-red-500" : ""}`}
                    name="cerca_oi_add"
                    placeholder="ADD"
                    value={formData.cerca_oi_add}
                    onChange={handleChange}
                    inputMode="decimal"
                  />
                  {errors.cerca_oi_add && <p className="mt-1 text-[10px] text-red-500">{errors.cerca_oi_add}</p>}
                </div>
              </div>
            </fieldset>
          </div>

          {/* DIAGNÓSTICO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico</label>
            <div className="grid grid-cols-2 gap-2">
              {["Astigmatismo", "Hipermetropía", "Miopía", "Presbicia"].map((d) => (
                <label key={d} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.diagnostico.includes(d)}
                    onChange={() => toggleDiagnostico(d)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border rounded-lg"
              placeholder="Escribe observaciones adicionales..."
            />
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : editingRecipe ? "Actualizar Receta" : "Guardar Receta"}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA - PREVISUALIZACIÓN */}
        <div className="border rounded-lg p-6 shadow-sm bg-gray-50">
          <h2 className="text-xl font-bold text-center mb-4">Previsualización de Receta</h2>
          
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-blue-600">CUBA VISIÓN PERÚ</h3>
            <p className="text-sm text-gray-500">Centro Oftalmológico</p>
          </div>

          <div className="text-sm space-y-1 mb-4">
            <p><strong>Paciente:</strong> {formData.nombre || "—"}</p>
            <p><strong>Edad:</strong> {calcularEdad(formData.fecha_nac) || "—"}</p>
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Tipo de lente:</strong> {formData.recTipoLente || "Mixto"}</p>
            <p><strong>Distancia pupilar:</strong> {formData.dpGeneral || "—"}</p>
          </div>

          {/* TABLA LEJOS */}
          <h3 className="font-semibold mt-4">LEJOS</h3>
          <div className="grid grid-cols-6 gap-2 text-center text-xs mt-2">
            <span></span>
            <span>ESF</span>
            <span>CIL</span>
            <span>EJE</span>
            <span>AVCC</span>
            <span>DIP</span>
            
            <strong>OD</strong>
            <span>{formData.lejos_od_esf || "—"}</span>
            <span>{formData.lejos_od_cil || "—"}</span>
            <span>{formData.lejos_od_eje || "—"}</span>
            <span>{formData.lejos_od_avcc || "—"}</span>
            <span>{formData.lejos_od_dip || "—"}</span>
            
            <strong>OI</strong>
            <span>{formData.lejos_oi_esf || "—"}</span>
            <span>{formData.lejos_oi_cil || "—"}</span>
            <span>{formData.lejos_oi_eje || "—"}</span>
            <span>{formData.lejos_oi_avcc || "—"}</span>
            <span>{formData.lejos_oi_dip || "—"}</span>
          </div>

          {/* TABLA CERCA */}
          <h3 className="font-semibold mt-6">CERCA</h3>
          <div className="grid grid-cols-5 gap-2 text-center text-xs mt-2">
            <span></span>
            <span>ESF</span>
            <span>CIL</span>
            <span>EJE</span>
            <span>ADD</span>
            
            <strong>OD</strong>
            <span>{formData.cerca_od_esf || "—"}</span>
            <span>{formData.cerca_od_cil || "—"}</span>
            <span>{formData.cerca_od_eje || "—"}</span>
            <span>{formData.cerca_od_add || "—"}</span>
            
            <strong>OI</strong>
            <span>{formData.cerca_oi_esf || "—"}</span>
            <span>{formData.cerca_oi_cil || "—"}</span>
            <span>{formData.cerca_oi_eje || "—"}</span>
            <span>{formData.cerca_oi_add || "—"}</span>
          </div>

          {/* Diagnóstico y Observaciones */}
          <div className="text-sm mt-6">
            <p>
              <strong>Diagnóstico:</strong>{" "}
              {formData.diagnostico.length > 0 ? formData.diagnostico.join(", ") : "—"}
            </p>
            <p>
              <strong>Observaciones:</strong> {formData.observaciones || "—"}
            </p>
          </div>

          {/* Firma */}
          <div className="mt-8 text-center text-sm">
            <strong>{datosOptometra.nombre}</strong>
            <p>{datosOptometra.cargo}</p>
            <p>CMP: {datosOptometra.cmp} - RNE: {datosOptometra.rne}</p>
          </div>
        </div>
      </form>
    </Modal>
  );
}