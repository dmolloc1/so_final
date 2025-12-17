from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/user/', include('User.urls')),      
    path('api/branch/', include('Branch.urls')),  
    path('api/', include('suppliers.urls')),  
    path('api/inventory/', include('inventory.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/cash/', include('cash.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/recipes/', include('recetas.urls')),

]
