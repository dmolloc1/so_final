import { NavLink } from "react-router-dom";

export default function SettingsTabs() {
  const tabs = [
    { label: "Central", path: "" }, 
    { label: "Usuarios Permisos", path: "users" },
    { label: "Sucursales", path: "branches" },
    { label: "Caja", path: "cash" },
    { label: "Proveedores", path: "supliers" },
    
  ];

  return (
    <div className="border-b border-gray-200 mb-1">
      <nav className="flex flex-wrap gap-7 text-sm sm:text-base p-3">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end
            className={({ isActive }) =>
              `pb-2 border-b-2 ${
                isActive
                  ? "border-blue-500 text-blue-500 font-bold"
                  : "border-transparent text-gray-600 hover:text-blue-500"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}