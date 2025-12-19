# 🗃️ Migraciones de Datos de Prueba

Este directorio contiene migraciones de Django que cargan datos de prueba en la base de datos del proyecto.

## 📋 Contenido de las Migraciones

### 1. **Branch** - Sucursales
- **Archivo**: `Branch/migrations/0005_load_sample_branches.py`
- **Datos**: 5 sucursales en diferentes departamentos del Perú
  - Óptica Central Arequipa
  - Óptica Mall Aventura
  - Óptica Yanahuara
  - Óptica Lima Centro
  - Óptica Cusco Plaza

### 2. **User** - Usuarios y Roles
- **Archivo**: `User/migrations/0011_load_sample_users.py`
- **Datos**: 8 usuarios con diferentes roles
  - admin (Gerente) - **Superusuario**
  - supervisor1 (Supervisor)
  - cajero1, cajero2 (Cajeros)
  - vendedor1, vendedor2 (Vendedores)
  - optometra1 (Optometra)
  - logistica1 (Logística)
- **Contraseña**: Todos los usuarios tienen la contraseña `admin123`

### 3. **Suppliers** - Proveedores
- **Archivo**: `suppliers/migrations/0003_load_sample_suppliers.py`
- **Datos**: 6 proveedores principales
  - Ray-Ban Perú S.A.C.
  - Oakley Distribution SAC
  - Lentes Zeiss Perú EIRL
  - Óptica Global Import S.A.
  - Visión Clara Distribuidores SAC
  - Monturas Exclusivas S.R.L.

### 4. **Clients** - Clientes
- **Archivo**: `clients/migrations/0004_load_sample_clients.py`
- **Datos**: 10 clientes con diferentes tipos de documento (DNI, CE)

### 5. **Inventory** - Productos e Inventario
- **Archivo**: `inventory/migrations/0009_load_sample_products.py`
- **Datos**:
  - 10 categorías de productos
  - 10 productos GLOBALES (disponibles en todas las sucursales)
  - 4 productos LOCALES (específicos por sucursal)
  - Inventario distribuido en 3 sucursales con stock inicial

### 6. **Cash** - Cajas y Aperturas
- **Archivo**: `cash/migrations/0003_load_sample_cash_data.py`
- **Datos**:
  - 4 cajas registradoras
  - 5 aperturas de caja (algunas abiertas, otras cerradas)

## 🚀 Cómo Aplicar las Migraciones

### Opción 1: Desde Cero (Recomendado para desarrollo)

```bash
# 1. Eliminar la base de datos actual (SQLite)
cd backend
rm db.sqlite3

# 2. Aplicar todas las migraciones
python manage.py migrate

# 3. Verificar que se aplicaron correctamente
python manage.py showmigrations
```

### Opción 2: Base de Datos Existente

```bash
# Solo aplicar las migraciones de datos de prueba
cd backend
python manage.py migrate Branch 0005
python manage.py migrate User 0011
python manage.py migrate suppliers 0003
python manage.py migrate clients 0004
python manage.py migrate inventory 0009
python manage.py migrate cash 0003
```

## 🔐 Credenciales de Acceso

### Usuario Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Gerente (Superusuario)
- **Email**: admin@optica.com

### Otros Usuarios
Todos los usuarios de prueba tienen la misma contraseña: `admin123`

| Usuario | Rol | Email | Sucursal |
|---------|-----|-------|----------|
| supervisor1 | Supervisor | supervisor1@optica.com | Central Arequipa |
| cajero1 | Cajero | cajero1@optica.com | Central Arequipa |
| cajero2 | Cajero | cajero2@optica.com | Yanahuara |
| vendedor1 | Vendedor | vendedor1@optica.com | Central Arequipa |
| vendedor2 | Vendedor | vendedor2@optica.com | Mall Aventura |
| optometra1 | Optometra | optometra1@optica.com | Mall Aventura |
| logistica1 | Logística | logistica1@optica.com | Central Arequipa |

## 📊 Datos Disponibles

Después de aplicar las migraciones, tendrás:

- ✅ 5 sucursales activas
- ✅ 8 usuarios con diferentes roles
- ✅ 6 proveedores
- ✅ 10 clientes
- ✅ 10 categorías de productos
- ✅ 14 productos (10 globales + 4 locales)
- ✅ Stock distribuido en 3 sucursales
- ✅ 4 cajas registradoras
- ✅ 5 aperturas de caja

## 🔄 Revertir las Migraciones

Si necesitas eliminar los datos de prueba:

```bash
# Revertir una migración específica
python manage.py migrate Branch 0004  # Vuelve a la migración anterior
python manage.py migrate User 0010
python manage.py migrate suppliers 0002
python manage.py migrate clients 0003
python manage.py migrate inventory 0008
python manage.py migrate cash 0002
```

## ⚠️ Notas Importantes

1. **Entorno de Desarrollo**: Estas migraciones están diseñadas solo para desarrollo y pruebas.
2. **PostgreSQL**: El script SQL en `database_setup.sql` contiene la misma información para PostgreSQL.
3. **Colaboración**: Todos los miembros del equipo obtendrán los mismos datos al aplicar las migraciones.
4. **Orden**: Las migraciones se aplican automáticamente en el orden correcto gracias a las dependencias.

## 🛠️ Troubleshooting

### Error: "No such table"
```bash
# Aplica primero todas las migraciones estructurales
python manage.py migrate
```

### Error: "Duplicate entry"
```bash
# Los datos ya existen, puedes ignorar o eliminar la base de datos
rm db.sqlite3
python manage.py migrate
```

### Error: "Foreign key constraint"
```bash
# Asegúrate de aplicar las migraciones en el orden correcto
# Las dependencias están definidas en cada archivo de migración
python manage.py migrate
```

## 📝 Modificar Datos de Prueba

Para modificar los datos de prueba:

1. Edita el archivo de migración correspondiente
2. Aplica la migración nuevamente:
   ```bash
   python manage.py migrate nombre_app numero_migracion --fake
   python manage.py migrate nombre_app numero_migracion
   ```

## 🎯 Próximos Pasos

Después de aplicar las migraciones:

1. Inicia el servidor: `python manage.py runserver`
2. Accede al admin: `http://localhost:8000/admin`
3. Login con: `admin` / `admin123`
4. Explora los datos precargados

---

**Creado para**: Proyecto CS - Registra-me  
**Fecha**: Diciembre 2025  
**Versión**: 1.0
