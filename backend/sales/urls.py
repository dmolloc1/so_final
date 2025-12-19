from django.urls import path, include
from rest_framework.routers import DefaultRouter
from sales.views import VentaDetalleViewSet, VentaViewSet, ComprobanteViewSet,  consultar_dni_reniec
from sales.reports_views import (
    get_sales_report,
    get_financial_report,
    get_branch_comparison,
    get_clients_report,
    get_pending_sales,
    get_sales_list,
    get_cash_report,
    export_sales_csv,
    export_clients_debt_csv,
    export_branch_comparison_csv,
    get_seller_sales_history,
    export_seller_sales_history_csv
)

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
    
    # Endpoints de reportes
    path('reports/sales/', get_sales_report, name='report-sales'),
    path('reports/financial/', get_financial_report, name='report-financial'),
    path('reports/branch-comparison/', get_branch_comparison, name='report-branch-comparison'),
    path('reports/clients/', get_clients_report, name='report-clients'),
    path('reports/pending-sales/', get_pending_sales, name='report-pending-sales'),
    path('reports/sales-list/', get_sales_list, name='report-sales-list'),
    path('reports/cash/', get_cash_report, name='report-cash'),  # Nuevo reporte por caja
    
    # Exportaciones
    path('reports/export/sales-csv/', export_sales_csv, name='export-sales-csv'),
    path('reports/export/clients-debt-csv/', export_clients_debt_csv, name='export-clients-debt-csv'),
    path('reports/export/branch-comparison-csv/', export_branch_comparison_csv, name='export-branch-comparison-csv'),
    path('reports/export/seller-sales-history-csv/', export_seller_sales_history_csv, name='export-seller-sales-history-csv'),
    
    # Historial de ventas por vendedor
    path('reports/seller-sales-history/', get_seller_sales_history, name='report-seller-sales-history'),
]