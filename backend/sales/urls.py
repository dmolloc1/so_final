from django.urls import path, include
from rest_framework.routers import DefaultRouter
from sales.views import VentaDetalleViewSet, VentaViewSet, ComprobanteViewSet,  consultar_dni_reniec

# Crear el router
router = DefaultRouter()

# Registrar los ViewSets
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'comprobantes', ComprobanteViewSet, basename='comprobante')
router.register(r'ventas-detalles', VentaDetalleViewSet, basename='venta_detalle')

# URLs
urlpatterns = [
    path('', include(router.urls)),
    path('proxy/dni', consultar_dni_reniec, name='consultar-dni'), 
]