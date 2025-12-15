# recipes/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecetaViewSet

router = DefaultRouter()
router.register(r'', RecetaViewSet, basename='receta')

urlpatterns = [
    path('', include(router.urls)),
]