"use client";

import React, { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "../../../../components/Table/DataTable";
import clientService, { type Client } from "../../../../services/clientService";
import ClientForm from "./ClienteForm";

interface ClientesProps {
  onAddReceta?: (cliente: Client) => void;
  onVerRecetas?: (cliente: Client) => void;
}

export default function Clientes({ onAddReceta, onVerRecetas }: ClientesProps) {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, [searchTerm]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientService.getAll({ search: searchTerm });
      setClients(data);
    } catch (err: any) {
      console.error("Error cargando clientes:", err);
      setError("Error al cargar clientes. Verifica la conexion con el backend.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (client: Client) => {
    try {
      if (editingClient && editingClient.cli_cod) {
        await clientService.update(editingClient.cli_cod, client);
      } else {
        await clientService.create(client);
      }
      setShowForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (err: any) {
      console.error("Error guardando cliente:", err);
      throw err; 
    }
  };

  const handleDelete = async (client: Client) => {
    if (window.confirm(`¿Eliminar a "${client.cli_nombre} ${client.cli_apellido}"?`)) {
      try {
        await clientService.delete(client.cli_cod!);
        fetchClients();
      } catch (err) {
        console.error("Error eliminando cliente:", err);
        alert("Error al eliminar cliente");
      }
    }
  };

  const getTipoDocLabel = (tipo: string): string => {
    return tipo === 'DNI' ? 'DNI' : 'C.E';
  };

  const columns: Column<Client>[] = [
    { key: "cli_cod", label: "COD" },
    {
      key: "cli_tipo_doc",
      label: "TIPO",
      render: (row) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
          {getTipoDocLabel(row.cli_tipo_doc)}
        </span>
      )
    },
    { key: "cli_dni", label: "DOCUMENTO" },
    { key: "cli_nombre", label: "NOMBRE" },
    { key: "cli_apellido", label: "APELLIDO" },
    { key: "cli_email", label: "EMAIL" },
    { key: "cli_telefono", label: "TELEFONO" },
    { key: "cli_fecha_nac", label: "FECHANACIMIENTO" },
    {
      key: "actions",
      label: "ACCIONES",
      render: (row) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              onVerRecetas?.(row);
              navigate("/prescriptions", {
                state: { clienteSeleccionado: row },
              });
            }}
            className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            title="Ver Recetas"
          >
            <span className="text-xs font-bold">Ver Recetas</span>
          </button>
          <button
            onClick={() => {
              onAddReceta?.(row);
              navigate("/prescriptions", {
                state: { clienteSeleccionado: row, abrirFormularioReceta: true },
              });
            }}
            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            title="Agregar Receta"
          >
            <span className="text-xs font-bold">+ Agregar Receta</span>
          </button>
          <button
            onClick={() => {
              setEditingClient(row);
              setShowForm(true);
            }}
            className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion de Clientes</h1>
            <p className="text-sm text-gray-600 mt-1">Administra la informacion de tus clientes</p>
          </div>
          <button
            onClick={() => {
              setEditingClient(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>

        <div className="flex gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button
            onClick={fetchClients}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading && clients.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              <p className="text-gray-600">Cargando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-2">No se encontraron clientes</p>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? "Intenta con otros terminos de busqueda"
                  : "Agrega tu primer cliente usando el boton de arriba"}
              </p>
            </div>
          ) : (
            <DataTable columns={columns} data={clients} />
          )}
        </div>
      </div>

      <ClientForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingClient(null);
        }}
        onSubmit={handleSave}
        client={editingClient}
        mode={editingClient ? "edit" : "create"}
      />
    </div>
  );
}