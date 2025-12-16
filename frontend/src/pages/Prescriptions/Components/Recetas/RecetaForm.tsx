"use client";

import React, { useState, useEffect } from "react";
import Modal from "../../../../components/Modal/modal";
import FormInput from "../../../../components/Forms/FormInput";
import SearchInput from "../../../../components/Common/SearchInput";

import api from "../../../../auth/services/api";
import type { Client } from "../../../../services/clientService";
import type { Recipe } from "../../../../types/recipe";
import { useAuth } from "../../../../auth/hooks/useAuth";

interface RecetaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Recipe>) => Promise<void>;
}

export default function RecetaForm({ isOpen, onClose, onSubmit }: RecetaFormProps) {
  // Estados principales

  const { user } = useAuth();

  const [paciente, setPaciente] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    dni: "",
    tipoDoc: "DNI",
    nombre: "",
    fecha_nac: "",
    telefono: "",
    receTipoLent: "Mixto",
    distPupilar: "",

    // Lejos
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

    // Cerca
    cerca_od_esf: "",
    cerca_od_cil: "",
    cerca_od_eje: "",
    cerca_od_add: "",

    cerca_oi_esf: "",
    cerca_oi_cil: "",
    cerca_oi_eje: "",
    cerca_oi_add: "",

    diagnostico: [] as string[],
    observaciones: "",
  });

  const [loading, setLoading] = useState(false);

  // Buscar paciente por DNI
  const buscarPaciente = async () => {
    const docValue = formData.dni.trim();
    const isDni = formData.tipoDoc === "DNI";

    if (isDni && !/^\d{8}$/.test(docValue)) return;
    if (!isDni && docValue.length < 9) return;

    try {
      const response = await api.get(`/clients/`, {
        params: { search: docValue, tipo_doc: formData.tipoDoc },
      });
      const data =
        response.data?.results || response.data?.data || response.data;

      if (Array.isArray(data) && data.length > 0) {
        const cli = data[0];
        setPaciente(cli);

        setFormData((prev) => ({
          ...prev,
          nombre: `${cli.cli_nombre} ${cli.cli_apellido}`,
          fecha_nac: cli.cli_fecha_nac?.split("T")[0] || "",
          telefono: cli.cli_telefono || "",
        }));
      }
    } catch (error) {
      console.error("Error buscando paciente:", error);
    }
  };

  // --------------------------------------------------
  // Manejo de inputs generales
  // --------------------------------------------------
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // --------------------------------------------------
  // Manejo de Checkboxes Diagnóstico
  // --------------------------------------------------
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

  // Enviar receta al backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paciente) {
      alert("Debe seleccionar un paciente válido.");
      return;
    }

    setLoading(true);
    try {
      const distPupilar =
        formData.distPupilar ||
        formData.lejos_od_dip ||
        formData.lejos_oi_dip ||
        formData.cerca_od_add;

      await onSubmit({
        cliCod: paciente.cli_cod,
        receFech: new Date().toISOString().split("T")[0],
        receObserva: formData.observaciones || undefined,
        receTipoLent: formData.receTipoLent,
        receEstado: "Activo",
        receEsfeD: formData.lejos_od_esf || "0",
        receCilinD: formData.lejos_od_cil || "0",
        receEjeD: Number(formData.lejos_od_eje || 0),
        receEsfel: formData.lejos_oi_esf || "0",
        receCilinl: formData.lejos_oi_cil || "0",
        receEjel: Number(formData.lejos_oi_eje || 0),
        receDistPupilar: distPupilar || "0",
        sucurCod: user?.sucurCod,
        usuCod: esOptometraActivo ? user?.usuCod ?? null : null,
      });

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
      receTipoLent: "Mixto",
      distPupilar: "",
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
    onClose();
  };

  // Vista previa - cálculos
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

  const esOptometraActivo = user?.roles?.some((rol) => rol.rolNom === "OPTOMETRA");

  const datosOptometra = {
    nombre: esOptometraActivo && user?.usuNombreCom ? user.usuNombreCom : optometraPorDefecto.nombre,
    cargo:
      esOptometraActivo && user?.optometra?.optCargo
        ? user.optometra.optCargo
        : optometraPorDefecto.cargo,
    cmp:
      esOptometraActivo && user?.optometra?.optCMP
        ? user.optometra.optCMP
        : optometraPorDefecto.cmp,
    rne:
      esOptometraActivo && user?.optometra?.optRNE
        ? user.optometra.optRNE
        : optometraPorDefecto.rne,
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Receta" size="xl">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* IZQUIERDA */}
        <div className="space-y-6">

          {/* DATOS DEL PACIENTE */}
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">Datos del Paciente</h2>

            {/* DNI + botón buscar */}
            <div className="flex items-end gap-2">
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  name="tipoDoc"
                  value={formData.tipoDoc}
                  onChange={handleChange}
                  className="w-full h-11 border rounded-lg px-2"
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">Carnet de extranjería</option>
                </select>
              </div>

              <FormInput
                label="Documento del Paciente"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                maxLength={formData.tipoDoc === "DNI" ? 8 : 12}
                required
              />

              <button
                type="button"
                onClick={buscarPaciente}
                className="h-11 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Buscar
              </button>
            </div>

            {/* Datos auto llenados */}
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
                name="receTipoLent"
                value={formData.receTipoLent}
                onChange={handleChange}
                placeholder="Mixto"
              />

              <FormInput
                label="Distancia Pupilar"
                name="distPupilar"
                value={formData.distPupilar}
                onChange={handleChange}
                placeholder="DIP"
              />
            </div>

            {/* LEJOS */}
            <fieldset className="border p-3 rounded-lg mb-4">
              <legend className="text-gray-500">Lejos</legend>

              {/* OD */}
              <div className="grid grid-cols-6 gap-2 items-center mt-2">
                <span className="font-semibold col-span-1">OD</span>

                <input className="border p-2 rounded text-center" name="lejos_od_esf" placeholder="ESF" value={formData.lejos_od_esf} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="lejos_od_cil" placeholder="CIL" value={formData.lejos_od_cil} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="lejos_od_eje" placeholder="EJE" value={formData.lejos_od_eje} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="lejos_od_avcc" placeholder="AVCC" value={formData.lejos_od_avcc} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="lejos_od_dip" placeholder="DIP" value={formData.lejos_od_dip} onChange={handleChange} />
              </div>

              {/* OI */}
              <div className="grid grid-cols-6 gap-2 items-center mt-2">
                <span className="font-semibold col-span-1">OI</span>

                <input className="border p-2 rounded text-center" name="lejos_oi_esf" placeholder="ESF" value={formData.lejos_oi_esf} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="lejos_oi_cil" placeholder="CIL" value={formData.lejos_oi_cil} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="lejos_oi_eje" placeholder="EJE" value={formData.lejos_oi_eje} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="lejos_oi_avcc" placeholder="AVCC" value={formData.lejos_oi_avcc} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="lejos_oi_dip" placeholder="DIP" value={formData.lejos_oi_dip} onChange={handleChange} />
              </div>
            </fieldset>

            {/* CERCA */}
            <fieldset className="border p-3 rounded-lg">
              <legend className="text-gray-500">Cerca</legend>

              {/* OD */}
              <div className="grid grid-cols-5 gap-2 items-center mt-2">
                <span className="font-semibold col-span-1">OD</span>
                <input className="border p-2 rounded text-center" name="cerca_od_esf" placeholder="ESF" value={formData.cerca_od_esf} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="cerca_od_cil" placeholder="CIL" value={formData.cerca_od_cil} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="cerca_od_eje" placeholder="EJE" value={formData.cerca_od_eje} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="cerca_od_add" placeholder="ADD" value={formData.cerca_od_add} onChange={handleChange} />
              </div>

              {/* OI */}
              <div className="grid grid-cols-5 gap-2 items-center mt-2">
                <span className="font-semibold col-span-1">OI</span>
                <input className="border p-2 rounded text-center" name="cerca_oi_esf" placeholder="ESF" value={formData.cerca_oi_esf} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="cerca_oi_cil" placeholder="CIL" value={formData.cerca_oi_cil} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="cerca_oi_eje" placeholder="EJE" value={formData.cerca_oi_eje} onChange={handleChange} />
                <input className="border p-2 rounded text-center" name="cerca_oi_add" placeholder="ADD" value={formData.cerca_oi_add} onChange={handleChange} />
              </div>
            </fieldset>
          </div>

          {/* DIAGNÓSTICO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnóstico
            </label>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {loading ? "Guardando..." : "Guardar Receta"}
            </button>
          </div>
        </div>

        {/* DERECHA*/}
        <div className="border rounded-lg p-6 shadow-sm bg-gray-50">
          <h2 className="text-xl font-bold text-center mb-4">
            Previsualización de Receta
          </h2>

          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-blue-600">CUBA VISIÓN PERÚ</h3>
            <p className="text-sm text-gray-500">Centro Oftalmológico</p>
          </div>

          <div className="text-sm space-y-1 mb-4">
            <p><strong>Paciente:</strong> {formData.nombre || "—"}</p>
            <p><strong>Edad:</strong> {calcularEdad(formData.fecha_nac) || "—"}</p>
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
            <p>
              <strong>Tipo de lente:</strong> {formData.receTipoLent || "Mixto"}
            </p>
            <p>
              <strong>Distancia pupilar:</strong> {formData.distPupilar || "—"}
            </p>
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
            <span>{formData.lejos_od_esf}</span>
            <span>{formData.lejos_od_cil}</span>
            <span>{formData.lejos_od_eje}</span>
            <span>{formData.lejos_od_avcc}</span>
            <span>{formData.lejos_od_dip}</span>

            <strong>OI</strong>
            <span>{formData.lejos_oi_esf}</span>
            <span>{formData.lejos_oi_cil}</span>
            <span>{formData.lejos_oi_eje}</span>
            <span>{formData.lejos_oi_avcc}</span>
            <span>{formData.lejos_oi_dip}</span>
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
            <span>{formData.cerca_od_esf}</span>
            <span>{formData.cerca_od_cil}</span>
            <span>{formData.cerca_od_eje}</span>
            <span>{formData.cerca_od_add}</span>

            <strong>OI</strong>
            <span>{formData.cerca_oi_esf}</span>
            <span>{formData.cerca_oi_cil}</span>
            <span>{formData.cerca_oi_eje}</span>
            <span>{formData.cerca_oi_add}</span>
          </div>

          {/* Diagnóstico y Observaciones */}
          <div className="text-sm mt-6">
            <p>
              <strong>Diagnóstico:</strong>{" "}
              {formData.diagnostico.length > 0
                ? formData.diagnostico.join(", ")
                : "—"}
            </p>

            <p>
              <strong>Observaciones:</strong>{" "}
              {formData.observaciones || "—"}
            </p>
          </div>

          {/* Firma */}
          <div className="mt-8 text-center text-sm">
            <strong>{datosOptometra.nombre}</strong>
            <p>{datosOptometra.cargo}</p>
            <p>
              CMP: {datosOptometra.cmp} - RNE: {datosOptometra.rne}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}