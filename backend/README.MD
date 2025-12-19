# 🧾 Backend - Sistema de Gestión de Óptica

Sistema backend desarrollado en Django para gestión de ventas, inventario y facturación electrónica.

---

## 📦 Datos de Prueba Precargados

El proyecto incluye **migraciones automáticas** que cargan datos de prueba para desarrollo acutalmente para verificar el funcionamiento del sistena

# Resumen de Cambios - Datos de Prueba


### Migraciones de Django (6 archivos)

1. **Branch/migrations/0005_load_sample_branches.py**
   - Carga 5 sucursales de prueba
   - Incluye función de reversión

2. **User/migrations/0011_load_sample_users.py**
   - Carga 8 usuarios con diferentes roles
   - Contraseña hasheada: 2025
   - Incluye función de reversión

3. **suppliers/migrations/0003_load_sample_suppliers.py**
   - Carga 6 proveedores
   - RUCs válidos
   - Incluye función de reversión

4. **clients/migrations/0004_load_sample_clients.py**
   - Carga 10 clientes
   - DNI y CE válidos
   - Incluye función de reversión

5. **inventory/migrations/0009_load_sample_products.py**
   - Carga 10 categorías de productos
   - 14 productos (10 globales, 4 locales)
   - Inventario distribuido en 3 sucursales
   - Incluye función de reversión

6. **cash/migrations/0003_load_sample_cash_data.py**
   - Carga 4 cajas registradoras
   - 5 aperturas de caja
   - Incluye función de reversión



### Datos Disponibles

- 5 sucursales en Arequipa, Lima y Cusco
- 8 usuarios con roles diferentes (admin, cajeros, vendedores, etc.)
- 6 proveedores de marcas reconocidas
- 10 clientes de ejemplo
- 14 productos con precios e inventario
- 4 cajas con aperturas activas

##  Credenciales
**Otros usuarios:**
- cajero1, cajero2, vendedor1, vendedor2, optometra1, supervisor1, logistica1
- Todos con password: `2025`


### Migraciones Django
```bash
cd backend
python manage.py migrate
```

## Reversión

Para eliminar datos de prueba:
```bash
python manage.py migrate Branch 0004
python manage.py migrate User 0010
# etc...
```

- Solo para desarrollo y pruebas
- SQLite por defecto
- Compatible con PostgreSQL (usar database_setup.sql)
- Las migraciones tienen dependencias correctas
- Incluyen funciones de reversión


## 🧾 Registro de usuarios vía Postman (Alternativo)

Guía para crear usuarios manualmente usando Postman.

###  Pasos para registrarse

### 1. Instalar Postman

Descarga la extensión postman

---

### 2. Crear un nuevo request

- Método: `POST`  
- URL del endpoint:   http://127.0.0.1:8000/api/user/new/

---

### 3. Enviar el siguiente JSON en el cuerpo

Selecciona `Body > raw > JSON` y pega:

```json
{
  "usuNom": "FabianaPelotita",
  "usuEmail": "fabiana@example.com",
  "usuTel": "987654321",
  "usuNombreCom": "Fabiana Francinet Pacheco Palo",
  "usuDNI": "12345678",
  "usuContra": "2025",
  "roles": [1]
}
```
# Cajas con postman 

Guía para que abran y cierren caja, se asigna automaticamente la sucursal del token en sucurCod 
# Crear Caja
POST http://localhost:8000/api/cash/
```json
{
  "sucurCod": 1,
  "usuCod": 2,
  "cajNom": "Caja Principal Arequipa",
  "cajDes": "Caja ubicada en el mostrador principal",
  "cajEstado": "ACTIVO"
}
```
# Abrir caja asegurate que seas el usuario asignado, token del usuario asignado
POST http://localhost:8000/api/cash/opening/
```json
{
  "sucurCod": 1,
  "cajCod": 1,
  "cajaAperMontInicial": 150.00,
  "cajaAperObservacio": "Inicio de turno tarde"
}
```
# cerrar caja
POST http://localhost:8000/api/cash/opening/1/cerrar
```json
{
  "cajaAperMontCierre": 152.00
}
```