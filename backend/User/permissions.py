from rest_framework.permissions import BasePermission
from .models import User  # rolCod es posible Más de un acceso (muchos roles)

# Nivel 1 Acceso a todo incluyendo reportes - Para Gerente
class Nivel1Permission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and any(
            role.nivel == 1 for rol in request.user.roles.all()
        )


# Nivel 2 Área de ventas para Vendedor Caja - Para vendedor y Cajero
class Nivel2Permission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and any(
            role.nivel == 2 for rol in request.user.roles.all()
        )


# Nivel 3 Área de Inventario - Para Logística
class Nivel3Permission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and any(
            role.nivel == 3 for rol in request.user.roles.all()
        )


# Nivel 4 Área de Recetas - Para Optometra
class Nivel4Permission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and any(
            role.nivel == 4 for rol in request.user.roles.all()
        )
