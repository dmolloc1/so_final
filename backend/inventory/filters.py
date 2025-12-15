import django_filters
from django.db import models
from django.db.models import Case, When, DecimalField, F, Q
from django.db.models import Q 
from decimal import Decimal
from .models import Product

class ProductFilter(django_filters.FilterSet):
    # Filtros de búsqueda por texto
    search = django_filters.CharFilter(method='filter_search', label='Búsqueda general')
    
    # Filtros de Foreign Keys (exactos)
    catproCod = django_filters.NumberFilter(field_name='catproCod', lookup_expr='exact')
    provCod = django_filters.NumberFilter(field_name='provCod', lookup_expr='exact')
    
    # Filtros de texto (búsqueda parcial)
    prodMarca = django_filters.CharFilter(field_name='prodMarca', lookup_expr='icontains')
    prodMate = django_filters.CharFilter(field_name='prodMate', lookup_expr='icontains')
    prodDescr = django_filters.CharFilter(field_name='prodDescr', lookup_expr='icontains')
    
    # Filtros de selección (exactos)
    prodPublico = django_filters.ChoiceFilter(field_name='prodPublico', choices=Product.PUBLICO_CHOICES)
    prodOrigin = django_filters.ChoiceFilter(field_name='prodOrigin', choices=Product.PROD_ORIGIN_CHOICES)
    prodEstado = django_filters.ChoiceFilter(field_name='prodEstado', choices=Product.STATUS_CHOICES)
    prodTipoAfecIGV = django_filters.ChoiceFilter(field_name='prodTipoAfecIGV', choices=Product.IGV_CHOICES)
    
    # Filtro por sucursal propietaria (solo productos locales)
    branchOwner = django_filters.NumberFilter(field_name='branchOwner', lookup_expr='exact')
    
    # ✅ NUEVO: Filtro por sucursal (productos que existen en esa sucursal)
    sucursal = django_filters.NumberFilter(method='filter_by_sucursal', label='Filtrar por sucursal')
    
    # ✅ NUEVO: Filtro por disponibilidad en stock
    con_stock = django_filters.BooleanFilter(method='filter_con_stock', label='Solo productos con stock')
    
    # ✅ NUEVO: Filtros por precio de venta CON IGV (lo que ve el cliente)
    precio_venta_min = django_filters.NumberFilter(method='filter_precio_venta_min', label='Precio venta mínimo (con IGV)')
    precio_venta_max = django_filters.NumberFilter(method='filter_precio_venta_max', label='Precio venta máximo (con IGV)')
    
    # Filtros por precio base (sin IGV) - para uso interno
    precio_base_min = django_filters.NumberFilter(field_name='prodValorUni', lookup_expr='gte', label='Precio base mínimo (sin IGV)')
    precio_base_max = django_filters.NumberFilter(field_name='prodValorUni', lookup_expr='lte', label='Precio base máximo (sin IGV)')
    
    # Filtros por costo (solo para gerente/supervisores)
    costo_min = django_filters.NumberFilter(field_name='prodCostoInv', lookup_expr='gte', label='Costo mínimo')
    costo_max = django_filters.NumberFilter(field_name='prodCostoInv', lookup_expr='lte', label='Costo máximo')
    
    # Filtro por código de barras
    prodBarcode = django_filters.CharFilter(field_name='prodBarcode', lookup_expr='exact')

    def filter_search(self, queryset, name, value):
        """Búsqueda general en múltiples campos"""
        if value:
            return queryset.filter(
                Q(prodDescr__icontains=value) |
                Q(prodMarca__icontains=value) |
                Q(prodMate__icontains=value) |
                Q(prodBarcode__icontains=value)
            )
        return queryset

    def filter_precio_venta_min(self, queryset, name, value):
        """
        Filtra productos cuyo precio de venta CON IGV sea >= valor.
        Calcula el precio con IGV según el tipo de afectación.
        """
        if not value:
            return queryset
        
        # Convertir a Decimal para cálculos precisos
        value = Decimal(str(value))
        
        # Productos gravados (10): precio con IGV = prodValorUni * 1.18
        # Productos exonerados/inafectos (20, 30, 40): precio = prodValorUni
        return queryset.annotate(
            precio_con_igv=Case(
                When(prodTipoAfecIGV='10', then=F('prodValorUni') * Decimal('1.18')),
                default=F('prodValorUni'),
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        ).filter(precio_con_igv__gte=value)

    def filter_precio_venta_max(self, queryset, name, value):
        """
        Filtra productos cuyo precio de venta CON IGV sea <= valor.
        Calcula el precio con IGV según el tipo de afectación.
        """
        if not value:
            return queryset
        
        value = Decimal(str(value))
        
        return queryset.annotate(
            precio_con_igv=Case(
                When(prodTipoAfecIGV='10', then=F('prodValorUni') * Decimal('1.18')),
                default=F('prodValorUni'),
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        ).filter(precio_con_igv__lte=value)

    def filter_by_sucursal(self, queryset, name, value):
        """
        Filtra productos que existen en una sucursal específica.
        Incluye:
        - Productos GLOBALES que tienen inventario en esa sucursal
        - Productos LOCALES que pertenecen a esa sucursal
        """
        if not value:
            return queryset
        
        from .models import BranchInventory
        
        # IDs de productos que tienen inventario en esta sucursal
        productos_con_inventario = BranchInventory.objects.filter(
            sucurCod=value
        ).values_list('prodCod', flat=True)
        
        # Filtrar productos que:
        # 1. Son LOCALES y pertenecen a esta sucursal, O
        # 2. Son GLOBALES y tienen inventario en esta sucursal
        return queryset.filter(
            Q(prodOrigin='LOCAL', branchOwner=value) |
            Q(prodOrigin='GLOBAL', prodCod__in=productos_con_inventario)
        ).distinct()

    def filter_con_stock(self, queryset, name, value):
        """
        Filtra productos que tienen stock disponible (> 0).
        Si se combina con filter_by_sucursal, filtra solo en esa sucursal.
        Si no, filtra productos con stock en CUALQUIER sucursal.
        """
        if not value:
            return queryset
        
        from .models import BranchInventory
        
        # Obtener el filtro de sucursal si existe
        sucursal_id = self.data.get('sucursal')
        
        if sucursal_id:
            # Stock en sucursal específica
            productos_con_stock = BranchInventory.objects.filter(
                sucurCod=sucursal_id,
                invStock__gt=0
            ).values_list('prodCod', flat=True)
        else:
            # Stock en CUALQUIER sucursal
            productos_con_stock = BranchInventory.objects.filter(
                invStock__gt=0
            ).values_list('prodCod', flat=True).distinct()
        
        return queryset.filter(prodCod__in=productos_con_stock)

    class Meta:
        model = Product
        fields = [
            'search', 'catproCod', 'provCod',
            'prodMarca', 'prodMate', 'prodDescr',
            'prodPublico', 'prodOrigin', 'prodEstado',
            'prodTipoAfecIGV', 'branchOwner',
            'sucursal', 'con_stock',                 # Filtros de sucursal/stock
            'precio_venta_min', 'precio_venta_max',  # CON IGV (para vendedores)
            'precio_base_min', 'precio_base_max',    # SIN IGV (para contabilidad)
            'costo_min', 'costo_max',                # Costo (para gerentes)
            'prodBarcode'
        ]