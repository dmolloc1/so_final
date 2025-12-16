from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # Login
    TokenRefreshView,     # Refrescar token
)
from .views import  UserViewSet, login_user, logout_user,login_user, logout_user,new_Usuario, list_users, delete_user,get_user, update_user, change_password, get_current_user, list_cashier_users, list_seller_users
from .views import CustomTokenObtainPairView

urlpatterns = [
    #path('login/', login_user, name='login_user'), #No se usara
    #path('logout/', logout_user, name='logout_user'), #No se usara
    # url de admin gestion de usuarios
    path('token/', CustomTokenObtainPairView.as_view(), name='token'),
    path('new/', new_Usuario, name='new_user'),
    path('', list_users, name='list_users'),
    path('delete/<int:usuCod>/', delete_user, name='delete_user'),
    path('get/<int:usuCod>/', get_user, name='get_user'),
    path('update/<int:usuCod>/', update_user, name='update_user'),
    path('change-password/<int:usuCod>/', change_password, name='change_password'),
    # Token para autenticación jwt login y logout a través de access y refresh en userservice 
    path('token/', CustomTokenObtainPairView.as_view(), name='token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    #Nuevo get current User para autenticacion por nivel de acceso
    path('current-user/', get_current_user, name = 'current_user'),
    path('list/cashier/', list_cashier_users, name = "cashiers_to_cash"),
    path('sellers/', list_seller_users, name='list-sellers'),


]
