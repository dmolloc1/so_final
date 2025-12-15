from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CashViewSet, CashOpeningViewSet

router = DefaultRouter()

router.register(r'opening', CashOpeningViewSet, basename='cash-opening')
router.register(r'', CashViewSet, basename='cash')
urlpatterns = [
    path('', include(router.urls)),
]