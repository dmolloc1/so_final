
##  Arquitectura Híbrida Multi-Sucursal

Este proyecto implementa un sistema de gestión para ópticas con **arquitectura híbrida basada en sucursales**, donde la información y permisos se cargan dinámicamente según la sucursal asignada al usuario autenticado.

---

## Concepto Principal: Sistema Branch-Centric

### Filosofía de Diseño
- **Todo está vinculado a la sucursal del usuario actual** (`current-user.sucurcod`)
- **Asignación automática**: Proveedores, productos, ventas y registros se crean automáticamente en la sucursal del usuario
- **Sin redundancia**: Los formularios NO solicitan selección de sucursal manualmente
- **Vista contextual**: Cada usuario ve solo lo relevante a su sucursal (excepto Gerentes)

---
---

## Configuración y Ejecución

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
### Microservicio
Asegurate de tener instalado php
```bash
cd .\microservicio-comprobantes\
php -S localhost:8001 -t public/
```
___

## Sistema de Roles y Niveles de Acceso

### Jerarquía de Roles
```typescript
enum RoleLevel {
  GERENTE = 0,      // 🔑 Acceso total multi-sucursal + configuración gerencial
  SUPERVISOR = 1,   // 🏢 Administrador de UNA sucursal específica
  CAJERO = 2,       // 💰 Solo módulo de ventas
  VENDEDOR = 2,     // 💰 Solo módulo de ventas
  LOGISTICA = 3,    // 📦 Solo módulo de inventario
  OPTOMETRA = 4     // 👓 Solo clientes y recetas
}
```

### Matriz de Permisos por Módulo

| Módulo         | Gerente (0) | Supervisor (1) | Cajero/Vendedor (2) | Logística (3) | Optómetra (4) |
|----------------|-------------|----------------|---------------------|---------------|---------------|
| **Dashboard**  | ✅ Global   | ✅ Sucursal    | ✅ Sucursal         | ✅ Sucursal   | ✅ Sucursal   |
| **Ventas**     | ✅ Todas    | ✅ Su sucursal | ✅ Su sucursal      | ❌            | ❌            |
| **Inventario** | ✅ Todas    | ✅ Su sucursal | ❌                  | ✅ Su sucursal| ❌            |
| **Recetas**    | ✅ Todas    | ✅ Su sucursal | ❌                  | ❌            | ✅ Su sucursal|
| **Reportes**   | ✅ Todas    | ✅ Su sucursal | ❌                  | ❌            | ❌            |
| **Configuración** | ✅ Gerencial | ✅ General  | ❌                  | ❌            | ❌            |

---

##  Flujo de Autenticación y Carga de Datos

### 1️⃣ Login y Detección de Sucursal
```typescript
// Al iniciar sesión, el sistema detecta:
const currentUser = {
  usuCod: 123,
  usuNombreCom: "Juan Pérez",
  sucurCod: 2,           // 🏢 Sucursal asignada (null si es Gerente)
  roles: [Role.SUPERVISOR]
}
```

### 2️ Carga Dinámica de Información
```typescript
// Todos los endpoints filtran automáticamente por sucursal:
GET /api/products?branch=${currentUser.sucurCod}
GET /api/suppliers?branch=${currentUser.sucurCod}
GET /api/sales?branch=${currentUser.sucurCod}
```

### 3️⃣ Comportamiento por Rol

#### 🔑 **GERENTE** (Nivel 0)
- ✅ `sucurCod = null` (no tiene sucursal fija)
- ✅ **Vista centralizada**: Dashboard con métricas de TODAS las sucursales
- ✅ **Configuración gerencial**: Puede crear/editar sucursales y usuarios
- ✅ **Vista selectiva**: Puede cambiar a vista de sucursal específica desde configuración
- ✅ Acceso a todas las funcionalidades del sistema

#### 🏢 **SUPERVISOR** (Nivel 1)
- ✅ `sucurCod = [ID de su sucursal]` (asignación fija)
- ✅ **Vista limitada**: Solo datos de SU sucursal
- ✅ **Administración completa** dentro de su sucursal
- ✅ **Creación de usuarios**: Solo puede asignarlos a SU sucursal (campo oculto)
- ❌ NO ve configuración gerencial ni puede gestionar sucursales
- ❌ NO puede cambiar de sucursal

#### 💰 **CAJERO/VENDEDOR** (Nivel 2)
- ✅ Solo módulo de **Ventas**
- ✅ Registra ventas automáticamente en su sucursal

#### 📦 **LOGÍSTICA** (Nivel 3)
- ✅ Solo módulo de **Inventario**
- ✅ Gestiona stock de su sucursal

#### 👓 **OPTÓMETRA** (Nivel 4)
- ✅ Solo módulos de **Clientes y Recetas**
- ✅ Registra recetas en su sucursal

---

## 📁 Estructura del Proyecto

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

### 🐍 **Backend** (Django + Django REST Framework)
```
backend/
├── registrame/                      # ⚙️ Proyecto principal Django
│   ├── __init__.py
│   ├── settings.py                  # Configuración global
│   ├── urls.py                      # Enrutamiento principal
│   ├── wsgi.py
│   └── asgi.py
│
├── User/                            # 👤 App de Usuarios y Roles
│   ├── models.py                    # User (con sucurCod), Role
│   ├── serializers.py
│   ├── views.py                     # Login, CurrentUser, CRUD Users
│   ├── permissions.py               # Permisos por rol
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
├── Branch/                          # 🏢 App de Sucursales
│   ├── models.py                    # Branch (sucursales)
│   ├── serializers.py
│   ├── views.py                     # CRUD Sucursales (solo Gerente)
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
├── inventory/                       # 📦 App de Inventario
│   ├── models.py                    # Product, ProductCategory, Stock
│   ├── serializers.py
│   ├── views.py                     # 🔍 Filtrado automático por sucursal
│   ├── filters.py                   # Filtros de búsqueda
│   ├── signals.py                   # Señales (ej: generar códigos de barras)
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
├── suppliers/                       # 🚚 App de Proveedores
│   ├── models.py                    # Supplier (con sucurCod)
│   ├── serializers.py
│   ├── views.py                     # 🔍 Filtrado por sucursal del usuario
│   ├── filters.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
├── sales/                           # 💰 App de Ventas
│   ├── models.py                    # Sale, SaleDetail, Comprobante
│   ├── serializers.py
│   ├── views.py                     # 🔍 Ventas por sucursal
│   ├── services.py                  # Lógica de negocio (stock, totales)
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
├── manage.py
├── db.sqlite3                       # Base de datos SQLite
├── requirements.txt                 # Dependencias Python
└── README.MD
```

---

## 🔄 Flujo de Creación de Registros (Auto-Asignación de Sucursal)

### Ejemplo: Creación de Proveedor

#### ❌ **Antes** (Redundante)
```typescript
// Formulario mostraba selector de sucursal

  Sucursal Centro
  Sucursal Norte

```

#### ✅ **Ahora** (Automático)
```typescript
// Frontend NO envía sucurCod
const createSupplier = async (data: SupplierFormData) => {
  const response = await api.post('/suppliers/', data);
  // Backend asigna automáticamente: supplier.sucurCod = request.user.sucurCod
}
```

### Implementación Backend (Django)
```python
# suppliers/views.py
class SupplierViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        # Auto-asignar sucursal del usuario autenticado
        serializer.save(sucurCod=self.request.user.sucurCod)
    
    def get_queryset(self):
        user = self.request.user
        # Si es Gerente, ver todos los proveedores
        if user.has_role('GERENTE'):
            return Supplier.objects.all()
        # Si no, solo de su sucursal
        return Supplier.objects.filter(sucurCod=user.sucurCod)
```

---

## 🎨 Diseño UI/UX

### Paleta de Colores (Tailwind)
- **Primario**: Definido en `tailwind.config.js` (usar en todos los componentes)
- **Botones comunes**: Utilizar componentes de `components/Common/`
- **Inputs**: Componente `SearchInput` con tema consistente

### Componentes Reutilizables
```typescript
import { AddButton, SearchInput } from '@/components/Common';
import { FormInput } from '@/components/Forms';
import { DataTable } from '@/components/Table';
```


---

## 📌 Reglas Críticas de Desarrollo

### ✅ **HACER**
1. ✅ Siempre filtrar datos por `currentUser.sucurCod`
2. ✅ Ocultar selectores de sucursal en formularios
3. ✅ Validar permisos tanto en frontend como backend
4. ✅ Mostrar solo opciones relevantes según el rol del usuario
5. ✅ Usar componentes comunes (`AddButton`, `SearchInput`, etc.)

### ❌ **NO HACER**
1. ❌ NO permitir que usuarios vean datos de otras sucursales (excepto Gerente) esto ya esta protegido por rutas pero siempre tenlo presente
2. ❌ NO mostrar campos de sucursal en formularios de creación
3. ❌ NO hardcodear IDs de sucursales en el código
4. ❌ NO olvidar validar permisos en cada endpoint del backend
5. ❌ NO permitir que Supervisores creen sucursales o accedan a configuración gerencial

---

## 📚 Próximos Pasos

- [ ] Implementar módulo de **Recetas Médicas**
- [ ] Sistema de **Reportes Gerenciales** con comparativas entre sucursales
- [ ] **Dashboard en tiempo real** con WebSockets
- [ ] Módulo de **Facturación Electrónica**

---

## 👥 Colaboradores

Este proyecto sigue una arquitectura modular y escalable. 
Si tienes dudas sobre la implementación de algún módulo, consulta este README o
Escribe al organizador del equipo a su wtts

**¡Bienvenidooo! 🎉**