from rest_framework.permissions import BasePermission
from .models import User  # rolCod es posible Más de un acceso (muchos roles)

# Nivel 1 Acceso a todo incluyendo reportes - Para Gerente
class Nivel1Permission(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.roles.filter(rolNivel=1).exists()
        )

# Nivel 2 Área de ventas para Vendedor Caja - Para vendedor y Cajero
class Nivel2Permission(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.roles.filter(rolNivel=2).exists()
        )

# Nivel 3 Área de Inventario - Para Logística
class Nivel3Permission(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.roles.filter(rolNivel=3).exists()
        )

# Nivel 4 Área de Recetas - Para Optometra
class Nivel4Permission(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.roles.filter(rolNivel=4).exists()
        )
