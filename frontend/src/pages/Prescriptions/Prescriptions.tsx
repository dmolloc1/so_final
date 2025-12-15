import { useState } from "react";
import ClientesPage from "./Components/Clientes/Clientes";
import RecetasPage from "./Components/Recetas/Recetas";
export default function Prescriptions() {
  const [selectedTab, setSelectedTab] = useState("clientes");

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
      {selectedTab === "clientes" && <ClientesPage />}
      {selectedTab === "recetas" && <RecetasPage />}

    </div>
  );
}
