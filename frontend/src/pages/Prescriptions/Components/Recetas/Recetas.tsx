"use client";

import { useEffect, useState } from "react";
import { recipeService } from "../../../../services/recipeService";
import type { Recipe } from "../../../../types/recipe";

import SearchInput from "../../../../components/Common/SearchInput";
import AddButton from "../../../../components/Common/AddButton";
import ReloadButton from "../../../../components/Common/ReloadButton";
import MoreInfoButton from "../../../../components/Common/MoreInfoButton";
import DataTable from "../../../../components/Table/DataTable";
import api from "../../../../auth/services/api";

// IMPORTA EL FORMULARIO DE RECETA
import RecetaForm from "./RecetaForm";

export default function RecetasPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [optometristas, setOptometristas] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);

  // ESTADO PARA ABRIR/CERRAR EL MODAL
  const [isRecetaFormOpen, setIsRecetaFormOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [optometraFilter, setOptometraFilter] = useState("");
  const [tipoLenteFilter, setTipoLenteFilter] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const loadSucursales = async () => {
    try {
      const response = await api.get("/branch/");
      const data = response.data?.data || response.data;
      setSucursales(data);
    } catch (error) {
      console.error("Error cargando sucursales:", error);
    }
  };

  const loadOptometristas = async () => {
    try {
      const response = await api.get("/user/");
      const data = response.data?.data || response.data;

      const lista = data.filter((u: any) =>
        u.roles?.some((r: any) => r.rolNom === "OPTOMETRA")
      );

      setOptometristas(lista);
    } catch (err) {
      console.error("Error cargando optometristas", err);
    }
  };

  const loadRecipes = async () => {
    try {
      const filters: any = {
        search: searchTerm || undefined,
        sucurCod: branchFilter || undefined,
        receTipoLent: tipoLenteFilter || undefined,
      };

      let data = await recipeService.getAll(filters);

      if (fechaInicio)
        data = data.filter((r) => new Date(r.receFech) >= new Date(fechaInicio));

      if (fechaFin)
        data = data.filter((r) => new Date(r.receFech) <= new Date(fechaFin));

      if (optometraFilter)
        data = data.filter((r) => String(r.usuCod) === String(optometraFilter));

      setRecipes(data);
    } catch (error) {
      console.error("Error cargando recetas:", error);
    }
  };

  useEffect(() => {
    loadOptometristas();
    loadSucursales();
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [searchTerm, branchFilter, optometraFilter, tipoLenteFilter, fechaInicio, fechaFin]);

  const columns = [
    {
      key: "optometra_nombre",
      label: "Optómetra",
      render: (row: Recipe) => row.optometra_nombre || "—",
    },
    {
      key: "receFech",
      label: "Fecha",
      render: (row: Recipe) => new Date(row.receFech).toLocaleDateString(),
    },
    {
      key: "cliCod",
      label: "Documento Cliente",
      render: (row: Recipe) => row.cliente_documento || "—",
    },
    {
      key: "cliente_nombre",
      label: "Cliente",
      render: (row: Recipe) => row.cliente_nombre || "—",
    },
    {
      key: "sucursal_nombre",
      label: "Sucursal",
      render: (row: Recipe) => row.sucursal_nombre || "—",
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row: Recipe) => (
        <MoreInfoButton
          onView={() => console.log("Ver receta", row.receCod)}
          onDelete={() => console.log("Eliminar receta", row.receCod)}
        />
      ),
    },
  ];

  const inputClass =
    "border border-gray-300 px-4 py-2 rounded-lg w-full";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Gestión de Recetas</h1>

        <div className="flex gap-3">
          <ReloadButton onClick={loadRecipes} />

          {/* BOTÓN PARA ABRIR FORMULARIO */}
          <AddButton onClick={() => setIsRecetaFormOpen(true)}>
            + Nueva Receta
          </AddButton>
        </div>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Documento (DNI o CE)"
        />

        {/* SUCURSALES */}
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className={inputClass}
        >
          <option value="">Todas las Sucursales</option>
          {sucursales.map((s) => (
            <option key={s.sucurCod} value={s.sucurCod}>
              {s.sucurNom}
            </option>
          ))}
        </select>

        {/* OPTÓMETRAS */}
        <select
          value={optometraFilter}
          onChange={(e) => setOptometraFilter(e.target.value)}
          className={inputClass}
        >
          <option value="">Todos los Optómetras</option>
          {optometristas.map((o) => (
            <option key={o.usuCod} value={o.usuCod}>
              {o.first_name} {o.last_name}
            </option>
          ))}
        </select>

        {/* TIPOS DE LENTE */}
        <select
          value={tipoLenteFilter}
          onChange={(e) => setTipoLenteFilter(e.target.value)}
          className={inputClass}
        >
          <option value="">Tipo de Lente</option>
          <option value="Blandos">Blandos</option>
          <option value="Rígidos">Rígidos</option>
          <option value="Mixtos">Mixtos</option>
        </select>

        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className={inputClass}
        />

        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className={inputClass}
        />
      </div>

      <DataTable columns={columns} data={recipes} />

      <RecetaForm
        isOpen={isRecetaFormOpen}
        onClose={() => setIsRecetaFormOpen(false)}
        onSubmit={async (data) => {
          const payload = {
            ...(data as Partial<Recipe>),
            receFech: (data as Partial<Recipe>).receFech ?? new Date().toISOString(),
          } as Omit<Recipe, "receCod">;

          await recipeService.create(payload);
          setIsRecetaFormOpen(false);
          loadRecipes();
        }}
      />
    </div>
  );
}