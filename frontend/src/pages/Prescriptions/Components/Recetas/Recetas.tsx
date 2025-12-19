"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { recipeService } from "../../../../services/recipeService";
import type { Recipe } from "../../../../types/recipe";
import type { Client } from "../../../../services/clientService";

import SearchInput from "../../../../components/Common/SearchInput";
import AddButton from "../../../../components/Common/AddButton";
import ReloadButton from "../../../../components/Common/ReloadButton";
import DataTable from "../../../../components/Table/DataTable";
import api from "../../../../auth/services/api";
import { notifyError, notifySuccess } from "../../../../shared/notifications";

import RecetaForm from "./RecetaForm";

interface RecetasProps {
  clienteSeleccionado?: Client | null;
  forzarAperturaFormulario?: boolean;
  onFormularioCerrado?: () => void;
}

export default function RecetasPage({
  clienteSeleccionado,
  forzarAperturaFormulario = false,
  onFormularioCerrado,
}: RecetasProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [optometristas, setOptometristas] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);

  const [isRecetaFormOpen, setIsRecetaFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [optometraFilter, setOptometraFilter] = useState("");
  const [tipoLenteFilter, setTipoLenteFilter] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [clientFilter, setClientFilter] = useState<number | string>("");

  const loadSucursales = async () => {
    const response = await api.get("/branch/");
    setSucursales(response.data?.data || response.data);
  };

  const loadOptometristas = async () => {
    const response = await api.get("/user/");
    const data = response.data?.data || response.data;
    setOptometristas(
      data.filter((u: any) =>
        u.roles?.some((r: any) => r.rolNom === "OPTOMETRA")
      )
    );
  };

  const loadRecipes = async () => {
    try {
      const storedBranch = (() => {
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          return (
            user.sucurCod ||
            user.sucursal?.sucurCod ||
            localStorage.getItem("sucursal") ||
            ""
          );
        } catch {
          return "";
        }
      })();

      const filters: any = {
        sucurCod: branchFilter || storedBranch || undefined,
        receTipoLent: tipoLenteFilter || undefined,
        usuCod: optometraFilter || undefined,
      };

      if (clientFilter) {
        filters.cliCod = clientFilter;
      } else if (searchTerm) {
        filters.search = searchTerm;
      }

      let data = await recipeService.getAll(filters);

      if (fechaInicio)
        data = data.filter(
          (r) => new Date(r.receFech) >= new Date(fechaInicio)
        );

      if (fechaFin)
        data = data.filter(
          (r) => new Date(r.receFech) <= new Date(fechaFin)
        );

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
  }, [
    searchTerm,
    branchFilter,
    optometraFilter,
    tipoLenteFilter,
    fechaInicio,
    fechaFin,
    clientFilter,
  ]);

  useEffect(() => {
    if (clienteSeleccionado?.cli_cod) {
      setSearchTerm("");
      setClientFilter(clienteSeleccionado.cli_cod);

      setTimeout(() => {
        loadRecipes();
      }, 0);
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    if (forzarAperturaFormulario) setIsRecetaFormOpen(true);
  }, [forzarAperturaFormulario]);

  const columns = [
    {
      key: "optometra_nombre",
      label: "Optómetra",
      render: (row: Recipe) => row.optometra_nombre || "—",
    },
    {
      key: "receFech",
      label: "Fecha",
      render: (row: Recipe) =>
        new Date(row.receFech).toLocaleDateString(),
    },
    {
      key: "cliente_documento",
      label: "Documento Cliente",
      render: (row: Recipe) => row.cliente_documento || "—",
    },
    {
      key: "cliente_nombre",
      label: "Cliente",
      render: (row: Recipe) => row.cliente_nombre || "—",
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row: Recipe) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              setEditingRecipe(row);
              setIsRecetaFormOpen(true);
            }}
            className="p-1.5 bg-blue-100 text-blue-600 rounded"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (
                row.receCod &&
                confirm("¿Deseas eliminar esta receta?")
              ) {
                await recipeService.delete(row.receCod);
                loadRecipes();
              }
            }}
            className="p-1.5 bg-red-100 text-red-600 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
          <AddButton onClick={() => setIsRecetaFormOpen(true)}>
            + Nueva Receta
          </AddButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <SearchInput
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setClientFilter(""); 
          }}
          placeholder="Buscar por DNI, nombre u optómetra"
        />

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
        onClose={() => {
          setEditingRecipe(null);
          setIsRecetaFormOpen(false);
          onFormularioCerrado?.();
        }}
        onSubmit={async (data) => {
          try {
            if (editingRecipe?.receCod) {
              await recipeService.update(editingRecipe.receCod, data);
              notifySuccess("Receta actualizada exitosamente.");
            } else {
              const payload: Omit<Recipe, "receCod"> = {
                ...data,
                receFech: data.receFech ?? new Date().toISOString(),
              } as Omit<Recipe, "receCod">;

              await recipeService.create(payload);
              notifySuccess("Receta creada exitosamente.");
            }

            setEditingRecipe(null);
            setIsRecetaFormOpen(false);
            onFormularioCerrado?.();
            loadRecipes();
          } catch (error) {
            console.error("Error guardando receta:", error);
            notifyError(
              editingRecipe?.receCod
                ? "Receta no actualizada."
                : "Receta no creada."
            );
            throw error;
          }
        }}
      />
    </div>
  );
}
