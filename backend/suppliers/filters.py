import django_filters
from .models import Supplier

class SupplierFilter(django_filters.FilterSet):

    # Búsqueda por nombre de empresa (sin distinción entre mayúsculas y minúsculas, coincidencia parcial) 
    provRazSocial = django_filters.CharFilter(
        lookup_expr='icontains',
        label='Business Name'
    )
    
    # Búsqueda por RUC (coincidencia exacta o parcial)
    provRuc = django_filters.CharFilter(
        lookup_expr='icontains',
        label='RUC'
    )
    
    # Búsqueda por ciudad (sin distinción entre mayúsculas y minúsculas, coincidencia parcial)
    provCiu = django_filters.CharFilter(
        lookup_expr='icontains',
        label='City'
    )
    
    # Filtrar por estado exacto
    provEstado = django_filters.ChoiceFilter(
        choices=Supplier.STATUS_CHOICES,
        label='Status'
    )
    
    # Buscar por correo electrónico (sin distinción entre mayúsculas y minúsculas, coincidencia parcial)
    provEmail = django_filters.CharFilter(
        lookup_expr='icontains',
        label='Email'
    )
    
    # General search across multiple fields
    search = django_filters.CharFilter(
        method='filter_search',
        label='General Search'
    )
    
    class Meta:
        model = Supplier
        fields = [
            'provRuc',
            'provRazSocial',
            'provCiu',
            'provEstado',
            'provEmail',
        ]
    
    def filter_search(self, queryset, name, value):
        """
        Método de filtro personalizado para buscar en varios campos
        """
        return queryset.filter(
            models.Q(provRazSocial__icontains=value) |
            models.Q(provRuc__icontains=value) |
            models.Q(provCiu__icontains=value) |
            models.Q(provEmail__icontains=value)
        )
    
from django.db import models