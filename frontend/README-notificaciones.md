# Notificaciones en el frontend

Este proyecto usa **react-hot-toast** para mostrar notificaciones.

## Instalación

Ejecuta en la carpeta `frontend`:

```bash
npm install react-hot-toast
```

## Uso rápido

El proveedor global (`Toaster`) ya está incluido en `src/App.tsx`.
Para disparar notificaciones desde cualquier módulo:

```ts
import { notifySuccess, notifyError, notifyWarning, notifyInfo } from '../shared/notifications'

notifySuccess('Operación realizada correctamente')
notifyError('Ocurrió un error')
notifyWarning('Revisa los datos ingresados')
notifyInfo('Información adicional')
```

