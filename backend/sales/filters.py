# sales/filters.py
import django_filters
from .models import Venta

class VentaFilter(django_filters.FilterSet):
    # Filtros exactos
    ventCod = django_filters.NumberFilter(field_name='ventCod')
    ventEstado = django_filters.ChoiceFilter(choices=Venta.ESTADO_VENTA)
    ventEstadoRecoj = django_filters.ChoiceFilter(choices=Venta.ESTADO_PEDIDO)
    ventFormaPago = django_filters.ChoiceFilter(choices=Venta.FORMA_PAGO)
    ventTarjetaTipo = django_filters.ChoiceFilter(choices=Venta.TIPO_TARJETA)
    cliDocTipo = django_filters.ChoiceFilter(choices=[('DNI', 'DNI'), ('RUC', 'RUC'), ('CE', 'CE')])
    
    # Filtros de búsqueda parcial (case-insensitive)
    cliente_nombre = django_filters.CharFilter(
        field_name='cliNombreCom', 
        lookup_expr='icontains',
        label='Nombre del cliente'
    )
    documento = django_filters.CharFilter(
        field_name='cliDocNum', 
        lookup_expr='icontains',
        label='Documento del cliente'
    )
    
    # Filtros de rango de fechas
    fecha_desde = django_filters.DateFilter(
        field_name='ventFecha', 
        lookup_expr='date__gte',
        label='Fecha desde'
    )
    fecha_hasta = django_filters.DateFilter(
        field_name='ventFecha', 
        lookup_expr='date__lte',
        label='Fecha hasta'
    )
    
    # Filtros booleanos
    anulada = django_filters.BooleanFilter(field_name='ventAnulada')
    con_saldo = django_filters.BooleanFilter(
        field_name='ventSaldo', 
        lookup_expr='gt',
        label='Con saldo pendiente'
    )
    
    # Filtro por vendedor
    vendedor = django_filters.NumberFilter(field_name='usuCod')
    
    # Búsqueda global
    buscar = django_filters.CharFilter(method='buscar_global', label='Búsqueda global')
    
    def buscar_global(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(cliNombreCom__icontains=value) |
            Q(cliDocNum__icontains=value) |
            Q(ventCod__icontains=value)
        )
    
    class Meta:
        model = Venta
        fields = []