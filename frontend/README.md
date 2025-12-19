### ⚛️ **Frontend** (React + TypeScript + Vite)
```
frontend/
├── public/                          # Archivos estáticos
│   └── vite.svg
│
├── src/
│   ├── assets/                      # 🎨 Recursos estáticos
│   │   ├── registrame.png
│   │   └── roles/                   # Ilustraciones por rol
│   │       ├── Cajero.png
│   │       ├── Gerente.png
│   │       ├── Logistica.png
│   │       ├── Optometra.png
│   │       └── Vendedor.png
│   │
│   ├── auth/                        # 🔐 Sistema de autenticación
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx   # Protege rutas por rol + sucursal
│   │   │   └── PublicRoute.tsx      # Bloquea login si hay sesión activa
│   │   ├── hooks/
│   │   │   └── userAuth.ts          # Hook de autenticación (user + branch)
│   │   ├── services/
│   │   │   ├── api.ts               # Axios con interceptores (incluye sucursal)
│   │   │   └── userService.ts       # login, logout, getCurrentUser
│   │   └── types/
│   │       └── user.ts              # Tipado: User, Role, Branch
│   │
│   ├── components/                  # 🧩 Componentes reutilizables
│   │   ├── Common/                  # Botones y búsqueda (con tema Tailwind)
│   │   │   ├── AddButton.tsx
│   │   │   ├── CancelButton.tsx
│   │   │   ├── MoreInfoButton.tsx
│   │   │   ├── ReloadButton.tsx
│   │   │   ├── RemoveButton.tsx
│   │   │   └── SearchInput.tsx
│   │   ├── Forms/
│   │   │   └── FormInput.tsx
│   │   ├── Modal/
│   │   │   └── modal.tsx
│   │   ├── Sidebar/
│   │   │   └── Sidebar.tsx          # Menú dinámico según rol
│   │   └── Table/
│   │       └── DataTable.tsx
│   │
│   ├── pages/                       # 📄 Módulos principales
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx        # Router de dashboards por rol
│   │   │   └── components/
│   │   │       ├── CentralDashboard/      # 🔑 Gerente: vista global
│   │   │       │   └── CentralDashboard.tsx
│   │   │       ├── GeneralDashboard/      # 👥 Otros roles: vista sucursal
│   │   │       │   └── GeneralDashboard.tsx
│   │   │       └── SupervisorDashboard/   # 🏢 Supervisor: métricas detalladas
│   │   │           └── SupervisorDashboard.tsx
│   │   │
│   │   ├── Inventory/               # 📦 Módulo de Inventario
│   │   │   ├── Inventory.tsx        # Vista principal
│   │   │   └── components/
│   │   │       ├── BranchInventory/       # Vista por sucursal
│   │   │       ├── GerencialInventory/    # Vista gerencial (todas)
│   │   │       ├── ProductFilters.tsx
│   │   │       ├── ProductList.tsx
│   │   │       └── ProductModal.tsx       # ⚠️ SIN selector de sucursal
│   │   │
│   │   ├── Login/                   # 🔐 Autenticación
│   │   │   ├── Login.tsx
│   │   │   └── components/
│   │   │       └── LoginForm.tsx
│   │   │
│   │   ├── Prescriptions/           # 👓 Recetas y Clientes
│   │   │   ├── Prescriptions.tsx
│   │   │   └── Components/
│   │   │       └── Clientes/
│   │   │           └── Clientes.tsx
│   │   │
│   │   ├── Reports/                 # 📊 Reportes y análisis
│   │   │   └── Reports.tsx
│   │   │
│   │   ├── Sale/                    # 💰 Punto de venta
│   │   │   └── Sale.tsx
│   │   │
│   │   ├── Settings/                # ⚙️ Configuración
│   │   │   ├── Settings.tsx
│   │   │   └── Components/
│   │   │       ├── Tabs/
│   │   │       │   └── SettingsTabs.tsx   # Tabs dinámicos por rol
│   │   │       ├── BranchManagement/      # 🔑 Solo Gerente
│   │   │       │   ├── Branches.tsx
│   │   │       │   ├── branchesForm.tsx
│   │   │       │   ├── DeleteConfirmModal.tsx
│   │   │       │   └── types/
│   │   │       │       └── branch.ts
│   │   │       ├── UserManagement/        # 🔑 Gerente + Supervisor
│   │   │       │   ├── Users.tsx
│   │   │       │   ├── UsersForm.tsx      # ⚠️ Sucursal auto-asignada
│   │   │       │   └── DeleteConfirmModal.tsx
│   │   │       ├── Proveedores/           # Proveedores
│   │   │       │   ├── Proveedores.tsx
│   │   │       │   └── ProveedorForm.tsx  # ⚠️ Sucursal auto-asignada
│   │   │       ├── GeneralManagement/
│   │   │       │   └── General.tsx        # Config general
│   │   │       └── TestBarcode.tsx        # Test de códigos de barras
│   │   │
│   │   └── TestInventory.tsx        # Página de pruebas
│   │
│   ├── routes/                      # 🛣️ Enrutamiento
│   │   └── AppRouter.tsx            # Rutas protegidas con ProtectedRoute
│   │
│   ├── services/                    # 🌐 API Services
│   │   ├── branchService.ts         # CRUD sucursales
│   │   ├── productService.ts        # CRUD productos (filtrado por sucursal)
│   │   └── supplierService.ts       # CRUD proveedores (filtrado por sucursal)
│   │
│   ├── shared/                      # 🔧 Utilidades compartidas
│   │   ├── BarcodeDisplay.tsx
│   │   ├── BarcodeGenerator.tsx
│   │   └── BarcodeScanner.tsx
│   │
│   ├── types/                       # 📝 Tipos TypeScript globales
│   │   ├── branch.ts
│   │   └── product.ts
│   │
│   ├── App.tsx                      # Componente raíz
│   ├── main.tsx                     # Entry point
│   ├── App.css
│   └── index.css                    # Estilos globales + Tailwind
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---
# Niveles de Acceso por Usuario segun el rol (Puede tener mas un rol)
## Un usuario User tiene un arreglo de roles roles: Role[]
```
 Nivel de alcance de Acceso 
GERENTE 0 TODO centralizado acceso a configuracion gerencial 
SUPERVISOR 1 Admin  TODO a su sucursal definida de usuario toda creacion sera a su sucursal en usuarios ira una condicional para que aparezca solo su sucursal no acceso a vista gerencial ni configuracion gerencial ni sucursales
CAJERO VENDEDOR 2 Ventas
LOGISTICA 3 Inventario 
OPTOMETRA 4 Clientes y Recetas

 dashboard: [1, 2, 3, 4],
  sale: [1, 2],
  inventory: [1, 3],
  prescriptions: [1, 4],
  reports: [1],
  settings: [1],

```
# Utiliza el color principal definido en tailwind.config.js y los common components como botones ysearch input