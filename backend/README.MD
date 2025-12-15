# 🧾 Registro de usuarios vía Postman

Guía para que los colaboradores creen su cuenta de usuario en el backend del proyecto usando Postman.

---

## 🚀 Pasos para registrarse

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
# 🧾 Cajas con postman 

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