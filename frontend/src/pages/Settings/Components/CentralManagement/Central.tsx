import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import generalSettings from "./generalSettings.json";

type GeneralSettings = {
  companyName: string;
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
};

export default function Central() {
  const initialSettings = useMemo<GeneralSettings>(() => ({ ...generalSettings }), []);
  const [formValues, setFormValues] = useState<GeneralSettings>(initialSettings);
  const [lastSaved, setLastSaved] = useState<GeneralSettings>(initialSettings);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleChange =
    (field: keyof GeneralSettings) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSave = () => {
    setLastSaved(formValues);
    setStatusMessage("Cambios guardados localmente.");
    window.setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleReset = () => {
    setFormValues(initialSettings);
    setStatusMessage("Se restauraron los valores iniciales.");
    window.setTimeout(() => setStatusMessage(""), 3000);
  };

  const isDirty = JSON.stringify(formValues) !== JSON.stringify(lastSaved);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-xl font-bold mb-1">Ajustes Generales</h1>
        <p className="text-sm text-gray-600">
          Edita los datos principales que se muestran en el sistema.
        </p>
      </header>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Información de la empresa</h2>
            <p className="text-sm text-gray-500 mt-1">
              Estos valores se cargan desde un archivo estático y pueden editarse aquí.
            </p>
          </div>
          <div className="text-xs text-gray-400">
            Última versión guardada: {lastSaved.displayName}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre legal</label>
            <input
              type="text"
              value={formValues.companyName}
              onChange={handleChange("companyName")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Empresa S.A."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre comercial</label>
            <input
              type="text"
              value={formValues.displayName}
              onChange={handleChange("displayName")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Marca"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo de contacto</label>
            <input
              type="email"
              value={formValues.contactEmail}
              onChange={handleChange("contactEmail")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="contacto@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formValues.contactPhone}
              onChange={handleChange("contactPhone")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="+51 999 888 777"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formValues.address}
              onChange={handleChange("address")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Av. Principal 123"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Restablecer
          </button>
          {statusMessage && (
            <span className="text-sm text-green-600">{statusMessage}</span>
          )}
        </div>
      </section>
    </div>
  );
}
