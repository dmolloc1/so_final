import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ClientesPage from "./Components/Clientes/Clientes";
import RecipePage from "./Components/Recipe/Recipe";
import type { Client } from "../../services/clientService";

interface LocationState {
  clienteSeleccionado?: Client;
  abrirFormularioReceta?: boolean;
}

export default function Prescriptions() {
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [selectedTab, setSelectedTab] = useState<"clientes" | "recetas">("clientes");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Client | null>(null);
  const [forzarAperturaFormulario, setForzarAperturaFormulario] = useState(false);

  useEffect(() => {
    if (state?.clienteSeleccionado) {
      setClienteSeleccionado(state.clienteSeleccionado);
      setSelectedTab("recetas");
    }

    if (state?.abrirFormularioReceta) {
      setForzarAperturaFormulario(true);
      setSelectedTab("recetas");
    }
  }, [state]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Prescripciones</h1>

      {/* Tabs */}
      <div className="flex gap-8 border-b pb-2 mb-6">
        <button
          className={`pb-2 transition-colors ${
            selectedTab === "clientes"
              ? "border-b-2 border-blue-600 text-blue-700 font-semibold"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setSelectedTab("clientes")}
        >
          Clientes
        </button>

        <button
          className={`pb-2 transition-colors ${
            selectedTab === "recetas"
              ? "border-b-2 border-blue-600 text-blue-700 font-semibold"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setSelectedTab("recetas")}
        >
          Recetas
        </button>
      </div>

      {/* Contenido */}
      {selectedTab === "clientes" && (
        <ClientesPage
          onAddReceta={(cliente) => {
            setClienteSeleccionado(cliente);
            setForzarAperturaFormulario(true);
            setSelectedTab("recetas");
          }}
          onVerRecetas={(cliente) => {
            setClienteSeleccionado(cliente);
            setForzarAperturaFormulario(false);
            setSelectedTab("recetas");
          }}
        />
      )}

      {selectedTab === "recetas" && (
        <RecipePage
          clienteSeleccionado={clienteSeleccionado}
          forzarAperturaFormulario={forzarAperturaFormulario}
          onFormularioCerrado={() => setForzarAperturaFormulario(false)}
        />
      )}
    </div>
  );
}
