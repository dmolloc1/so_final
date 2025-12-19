from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, F, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse
from io import BytesIO

from .models import Venta, VentaDetalle
from inventory.models import BranchInventory
from Branch.models import Branch


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sales_report(request):
    """Reporte de ventas totales y tendencias"""
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    branch_id = request.GET.get('branch_id')
    
    queryset = Venta.objects.exclude(ventEstado='ANULADO')
    
    if start_date:
        queryset = queryset.filter(ventFecha__gte=start_date)
    if end_date:
        queryset = queryset.filter(ventFecha__lte=end_date)
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    if is_manager:
        if branch_id:
            queryset = queryset.filter(sucurCod_id=branch_id)
    else:
        queryset = queryset.filter(sucurCod_id=user.sucurCod)
    
    total_sales = queryset.aggregate(
        total=Sum('ventTotal'),
        count=Count('ventCod')
    )
    
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_sales = queryset.filter(ventFecha__gte=thirty_days_ago).annotate(
        date=TruncDate('ventFecha')
    ).values('date').annotate(
        total=Sum('ventTotal'),
        count=Count('ventCod')
    ).order_by('date')
    
    twelve_months_ago = timezone.now() - timedelta(days=365)
    monthly_sales = queryset.filter(ventFecha__gte=twelve_months_ago).annotate(
        month=TruncMonth('ventFecha')
    ).values('month').annotate(
        total=Sum('ventTotal'),
        count=Count('ventCod')
    ).order_by('month')
    
    sales_by_branch = None
    if is_manager:
        sales_by_branch = queryset.values(
            'sucurCod__sucurNom', 'sucurCod_id'
        ).annotate(
            total=Sum('ventTotal'),
            count=Count('ventCod')
        ).order_by('-total')
    
    top_products = VentaDetalle.objects.filter(
        ventCod__in=queryset
    ).values(
        'prodCod__prodDescr',
        'prodCod__prodCod'
    ).annotate(
        quantity=Sum('ventDetCantidad'),
        total=Sum(F('ventDetCantidad') * F('ventDetPrecioUni'))
    ).order_by('-quantity')[:10]
    
    payment_methods = queryset.values('ventFormaPago').annotate(
        total=Sum('ventTotal'),
        count=Count('ventCod')
    )
    
    return Response({
        'total_sales': float(total_sales['total'] or 0),
        'sales_count': total_sales['count'] or 0,
        'daily_sales': list(daily_sales),
        'monthly_sales': list(monthly_sales),
        'sales_by_branch': list(sales_by_branch) if sales_by_branch else [],
        'top_products': list(top_products),
        'payment_methods': list(payment_methods),
        'is_manager': is_manager
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_financial_report(request):
    """Reporte de ingresos vs egresos"""
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    branch_id = request.GET.get('branch_id')
    
    queryset = Venta.objects.exclude(ventEstado='ANULADO')
    
    if start_date:
        queryset = queryset.filter(ventFecha__gte=start_date)
    if end_date:
        queryset = queryset.filter(ventFecha__lte=end_date)
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    if is_manager:
        if branch_id:
            queryset = queryset.filter(sucurCod_id=branch_id)
    else:
        queryset = queryset.filter(sucurCod_id=user.sucurCod)
    
    ingresos = queryset.aggregate(
        total=Sum('ventTotal'),
        pagado=Sum('ventAdelanto'),
        por_cobrar=Sum('ventSaldo')
    )
    
    productos_vendidos = VentaDetalle.objects.filter(
        ventCod__in=queryset
    ).aggregate(
        total_costo=Sum(F('ventDetCantidad') * F('prodCod__prodCostoInv'))
    )
    
    egresos_estimados = float(productos_vendidos['total_costo'] or 0)
    ingresos_total = float(ingresos['total'] or 0)
    utilidad_bruta = ingresos_total - egresos_estimados
    margen = (utilidad_bruta / ingresos_total * 100) if ingresos_total > 0 else 0
    
    twelve_months_ago = timezone.now() - timedelta(days=365)
    monthly_income = queryset.filter(ventFecha__gte=twelve_months_ago).annotate(
        month=TruncMonth('ventFecha')
    ).values('month').annotate(
        ingresos=Sum('ventTotal')
    ).order_by('month')
    
    return Response({
        'ingresos_total': float(ingresos['total'] or 0),
        'ingresos_pagado': float(ingresos['pagado'] or 0),
        'ingresos_por_cobrar': float(ingresos['por_cobrar'] or 0),
        'egresos_estimado': egresos_estimados,
        'utilidad_bruta': utilidad_bruta,
        'margen_porcentaje': margen,
        'monthly_data': list(monthly_income),
        'is_manager': is_manager
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_branch_comparison(request):
    """Comparativa entre sucursales (solo gerente)"""
    user = request.user
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    if not is_manager:
        return Response({'detail': 'No tiene permisos para ver este reporte'}, status=403)
    
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    branches = Branch.objects.all()
    comparison_data = []
    
    for branch in branches:
        queryset = Venta.objects.filter(sucurCod=branch).exclude(ventEstado='ANULADO')
        
        if start_date:
            queryset = queryset.filter(ventFecha__gte=start_date)
        if end_date:
            queryset = queryset.filter(ventFecha__lte=end_date)
        
        stats = queryset.aggregate(
            total_ventas=Sum('ventTotal'),
            cantidad_ventas=Count('ventCod'),
            promedio_venta=Avg('ventTotal'),
            total_por_cobrar=Sum('ventSaldo')
        )
        
        inventory_value = BranchInventory.objects.filter(sucurCod=branch).aggregate(
            total=Sum(F('invStock') * F('prodCod__prodValorUni'))
        )
        
        comparison_data.append({
            'branch_id': branch.sucurCod,
            'branch_name': branch.sucurNom,
            'total_ventas': float(stats['total_ventas'] or 0),
            'cantidad_ventas': stats['cantidad_ventas'] or 0,
            'promedio_venta': float(stats['promedio_venta'] or 0),
            'total_por_cobrar': float(stats['total_por_cobrar'] or 0),
            'valor_inventario': float(inventory_value['total'] or 0)
        })
    
    return Response({
        'branches': comparison_data,
        'is_manager': is_manager
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_clients_report(request):
    """Reporte de clientes clave y deudas"""
    user = request.user
    branch_id = request.GET.get('branch_id')
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    ventas_query = Venta.objects.exclude(ventEstado='ANULADO')
    
    if is_manager:
        if branch_id:
            ventas_query = ventas_query.filter(sucurCod_id=branch_id)
    else:
        ventas_query = ventas_query.filter(sucurCod_id=user.sucurCod)
    
    top_clients = ventas_query.values(
        'cliNombreCom',
        'cliDocNum'
    ).annotate(
        total_compras=Sum('ventTotal'),
        cantidad_compras=Count('ventCod'),
        total_deuda=Sum('ventSaldo')
    ).order_by('-total_compras')[:20]
    
    total_debt = ventas_query.filter(
        ventEstado__in=['PENDIENTE', 'PARCIAL']
    ).aggregate(
        total=Sum('ventSaldo'),
        count=Count('ventCod')
    )
    
    now = timezone.now()
    debt_aging = {
        'current': float(ventas_query.filter(
            ventEstado__in=['PENDIENTE', 'PARCIAL'],
            ventFecha__gte=now - timedelta(days=30)
        ).aggregate(total=Sum('ventSaldo'))['total'] or 0),
        '30_60': float(ventas_query.filter(
            ventEstado__in=['PENDIENTE', 'PARCIAL'],
            ventFecha__gte=now - timedelta(days=60),
            ventFecha__lt=now - timedelta(days=30)
        ).aggregate(total=Sum('ventSaldo'))['total'] or 0),
        '60_90': float(ventas_query.filter(
            ventEstado__in=['PENDIENTE', 'PARCIAL'],
            ventFecha__gte=now - timedelta(days=90),
            ventFecha__lt=now - timedelta(days=60)
        ).aggregate(total=Sum('ventSaldo'))['total'] or 0),
        'over_90': float(ventas_query.filter(
            ventEstado__in=['PENDIENTE', 'PARCIAL'],
            ventFecha__lt=now - timedelta(days=90)
        ).aggregate(total=Sum('ventSaldo'))['total'] or 0),
    }
    
    return Response({
        'top_clients': list(top_clients),
        'total_debt': float(total_debt['total'] or 0),
        'debt_count': total_debt['count'] or 0,
        'debt_aging': debt_aging,
        'is_manager': is_manager
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_sales(request):
    """Reporte de ventas pendientes"""
    user = request.user
    branch_id = request.GET.get('branch_id')
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    queryset = Venta.objects.filter(
        ventEstado__in=['PENDIENTE', 'PARCIAL']
    )
    
    if is_manager:
        if branch_id:
            queryset = queryset.filter(sucurCod_id=branch_id)
    else:
        queryset = queryset.filter(sucurCod_id=user.sucurCod)
    
    pending_sales = queryset.values(
        'ventCod',
        'cliNombreCom',
        'cliDocNum',
        'ventFecha',
        'ventTotal',
        'ventAdelanto',
        'ventSaldo',
        'ventEstado',
        'ventEstadoRecoj',
        'sucurCod__sucurNom'
    ).order_by('-ventFecha')
    
    summary = queryset.aggregate(
        total_pendiente=Sum('ventSaldo'),
        count=Count('ventCod')
    )
    
    by_status = queryset.values('ventEstadoRecoj').annotate(
        count=Count('ventCod'),
        total=Sum('ventSaldo')
    )
    
    return Response({
        'pending_sales': list(pending_sales),
        'summary': {
            'total_pendiente': float(summary['total_pendiente'] or 0),
            'count': summary['count'] or 0
        },
        'by_status': list(by_status),
        'is_manager': is_manager
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sales_list(request):
    """Obtener lista de ventas con paginación"""
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    branch_id = request.GET.get('branch_id')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    queryset = Venta.objects.exclude(ventEstado='ANULADO')
    
    if start_date:
        queryset = queryset.filter(ventFecha__gte=start_date)
    if end_date:
        queryset = queryset.filter(ventFecha__lte=end_date)
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    if is_manager:
        if branch_id:
            queryset = queryset.filter(sucurCod_id=branch_id)
    else:
        queryset = queryset.filter(sucurCod_id=user.sucurCod)
    
    total_count = queryset.count()
    total_pages = (total_count + page_size - 1) // page_size
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    sales = queryset.select_related('sucurCod').order_by('-ventFecha')[start_idx:end_idx].values(
        'ventCod',
        'ventFecha',
        'cliNombreCom',
        'cliDocNum',
        'sucurCod__sucurNom',
        'ventTotal',
        'ventAdelanto',
        'ventSaldo',
        'ventEstado',
        'ventFormaPago'
    )
    
    return Response({
        'sales': list(sales),
        'pagination': {
            'total': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        },
        'is_manager': is_manager
    })


# ========== EXPORTACIONES ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_sales_csv(request):
    """Exportar reporte de ventas a CSV"""
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    branch_id = request.GET.get('branch_id')
    
    queryset = Venta.objects.exclude(ventEstado='ANULADO')
    
    if start_date:
        queryset = queryset.filter(ventFecha__gte=start_date)
    if end_date:
        queryset = queryset.filter(ventFecha__lte=end_date)
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    if is_manager:
        if branch_id:
            queryset = queryset.filter(sucurCod_id=branch_id)
    else:
        queryset = queryset.filter(sucurCod_id=user.sucurCod)
    
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="reporte_ventas.csv"'
    response.write('\ufeff')
    
    writer = csv.writer(response)
    writer.writerow(['Código', 'Fecha', 'Cliente', 'Documento', 'Sucursal', 'Total', 'Adelanto', 'Saldo', 'Estado'])
    
    for venta in queryset.select_related('sucurCod'):
        writer.writerow([
            venta.ventCod,
            venta.ventFecha.strftime('%Y-%m-%d %H:%M'),
            venta.cliNombreCom,
            venta.cliDocNum,
            venta.sucurCod.sucurNom,
            venta.ventTotal,
            venta.ventAdelanto,
            venta.ventSaldo,
            venta.ventEstado
        ])
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_clients_debt_csv(request):
    """Exportar reporte de deudas de clientes a CSV"""
    user = request.user
    branch_id = request.GET.get('branch_id')
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    ventas_query = Venta.objects.filter(ventEstado__in=['PENDIENTE', 'PARCIAL'])
    
    if is_manager:
        if branch_id:
            ventas_query = ventas_query.filter(sucurCod_id=branch_id)
    else:
        ventas_query = ventas_query.filter(sucurCod_id=user.sucurCod)
    
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="reporte_deudas.csv"'
    response.write('\ufeff')
    
    writer = csv.writer(response)
    writer.writerow(['Cliente', 'Documento', 'Sucursal', 'Total Compras', 'Cantidad Ventas', 'Deuda Total'])
    
    clients_debt = ventas_query.values(
        'cliNombreCom',
        'cliDocNum',
        'sucurCod__sucurNom'
    ).annotate(
        total_compras=Sum('ventTotal'),
        cantidad_ventas=Count('ventCod'),
        total_deuda=Sum('ventSaldo')
    ).order_by('-total_deuda')
    
    for client in clients_debt:
        writer.writerow([
            client['cliNombreCom'],
            client['cliDocNum'],
            client['sucurCod__sucurNom'],
            client['total_compras'],
            client['cantidad_ventas'],
            client['total_deuda']
        ])
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_branch_comparison_csv(request):
    """Exportar comparativa de sucursales a CSV (solo gerente)"""
    user = request.user
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    if not is_manager:
        return Response({'detail': 'No autorizado'}, status=403)
    
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="comparativa_sucursales.csv"'
    response.write('\ufeff')
    
    writer = csv.writer(response)
    writer.writerow(['Sucursal', 'Total Ventas', 'Cantidad Ventas', 'Promedio Venta', 'Por Cobrar', 'Valor Inventario'])
    
    branches = Branch.objects.all()
    
    for branch in branches:
        queryset = Venta.objects.filter(sucurCod=branch).exclude(ventEstado='ANULADO')
        
        if start_date:
            queryset = queryset.filter(ventFecha__gte=start_date)
        if end_date:
            queryset = queryset.filter(ventFecha__lte=end_date)
        
        stats = queryset.aggregate(
            total_ventas=Sum('ventTotal'),
            cantidad_ventas=Count('ventCod'),
            promedio_venta=Avg('ventTotal'),
            total_por_cobrar=Sum('ventSaldo')
        )
        
        inventory_value = BranchInventory.objects.filter(sucurCod=branch).aggregate(
            total=Sum(F('invStock') * F('prodCod__prodValorUni'))
        )
        
        writer.writerow([
            branch.sucurNom,
            stats['total_ventas'] or 0,
            stats['cantidad_ventas'] or 0,
            stats['promedio_venta'] or 0,
            stats['total_por_cobrar'] or 0,
            inventory_value['total'] or 0
        ])
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cash_report(request):
    """Reporte de ventas por caja (sesión de apertura)"""
    user = request.user
    cash_opening_id = request.GET.get('cash_opening_id')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    branch_id = request.GET.get('branch_id')
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    # Importar modelo de caja
    from cash.models import CashOpening
    
    # Query base de sesiones de caja
    cash_openings_query = CashOpening.objects.select_related('cajCod', 'usuCod', 'cajCod__sucurCod')
    
    # Filtros de permisos
    if is_manager:
        if branch_id:
            cash_openings_query = cash_openings_query.filter(cajCod__sucurCod_id=branch_id)
    else:
        # Supervisor/Cajero solo ve sus cajas
        cash_openings_query = cash_openings_query.filter(cajCod__sucurCod=user.sucurCod)
    
    # Filtro por fechas
    if start_date:
        cash_openings_query = cash_openings_query.filter(cajaApertuFechHora__gte=start_date)
    if end_date:
        cash_openings_query = cash_openings_query.filter(cajaApertuFechHora__lte=end_date)
    
    # Si se especifica una sesión específica
    if cash_opening_id:
        cash_opening = cash_openings_query.filter(cajaAperCod=cash_opening_id).first()
        
        if not cash_opening:
            return Response({'detail': 'Sesión de caja no encontrada'}, status=404)
        
        # Obtener ventas de esta sesión
        ventas = Venta.objects.filter(
            cajaAperCod=cash_opening
        ).exclude(ventEstado='ANULADO')
        
        # Totales generales
        totales = ventas.aggregate(
            total_ventas=Sum('ventTotal'),
            total_igv=Sum('ventIGV'),
            total_subtotal=Sum('ventSubTotal'),
            total_gravada=Sum('ventTotalGravada'),
            total_exonerada=Sum('ventTotalExonerada'),
            total_inafecta=Sum('ventTotalInafecta'),
            cantidad_ventas=Count('ventCod')
        )
        
        # Totales por forma de pago
        por_forma_pago = ventas.values('ventFormaPago').annotate(
            total=Sum('ventTotal'),
            cantidad=Count('ventCod')
        ).order_by('-total')
        
        # Listado de ventas
        ventas_detalle = ventas.values(
            'ventCod',
            'ventFecha',
            'cliNombreCom',
            'cliDocNum',
            'ventTotal',
            'ventIGV',
            'ventSubTotal',
            'ventFormaPago',
            'ventEstado'
        ).order_by('-ventFecha')
        
        # Calcular diferencia de caja
        monto_esperado = float(totales['total_ventas'] or 0) + (float(cash_opening.cajaAperMontInicial) if cash_opening.cajaAperMontInicial else 0)
        monto_cierre = float(cash_opening.cajaAperMontCierre) if cash_opening.cajaAperMontCierre else None
        diferencia = (monto_cierre - monto_esperado) if monto_cierre is not None else None
        
        return Response({
            'cash_opening': {
                'cajaAperCod': cash_opening.cajaAperCod,
                'cajNom': cash_opening.cajCod.cajNom,
                'usuCod': cash_opening.usuCod.usuCod,
                'usuNombreCom': cash_opening.usuCod.usuNombreCom,
                'sucurNom': cash_opening.cajCod.sucurCod.sucurNom,
                'cajaApertuFechHora': cash_opening.cajaApertuFechHora,
                'cajaAperFechaHorCierre': cash_opening.cajaAperFechaHorCierre,
                'cajaAperMontInicial': float(cash_opening.cajaAperMontInicial),
                'cajaAperMontCierre': monto_cierre,
                'cajaAperMontEsperado': monto_esperado,
                'cajaAperDiferencia': diferencia,
                'cajaAperEstado': cash_opening.cajaAperEstado,
                'cajaAperObservacio': cash_opening.cajaAperObservacio
            },
            'totales': {
                'total_ventas': float(totales['total_ventas'] or 0),
                'total_igv': float(totales['total_igv'] or 0),
                'total_subtotal': float(totales['total_subtotal'] or 0),
                'total_gravada': float(totales['total_gravada'] or 0),
                'total_exonerada': float(totales['total_exonerada'] or 0),
                'total_inafecta': float(totales['total_inafecta'] or 0),
                'cantidad_ventas': totales['cantidad_ventas'] or 0
            },
            'por_forma_pago': list(por_forma_pago),
            'ventas': list(ventas_detalle),
            'is_manager': is_manager
        })
    
    else:
        # Listado de sesiones de caja
        cash_openings_list = []
        
        for opening in cash_openings_query.order_by('-cajaApertuFechHora')[:50]:
            ventas_count = Venta.objects.filter(
                cajaAperCod=opening
            ).exclude(ventEstado='ANULADO').count()
            
            ventas_total = Venta.objects.filter(
                cajaAperCod=opening
            ).exclude(ventEstado='ANULADO').aggregate(
                total=Sum('ventTotal')
            )['total'] or 0
            
            cash_openings_list.append({
                'cajaAperCod': opening.cajaAperCod,
                'cajNom': opening.cajCod.cajNom,
                'usuNombreCom': opening.usuCod.usuNombreCom,
                'sucurNom': opening.cajCod.sucurCod.sucurNom,
                'cajaApertuFechHora': opening.cajaApertuFechHora,
                'cajaAperFechaHorCierre': opening.cajaAperFechaHorCierre,
                'cajaAperMontInicial': float(opening.cajaAperMontInicial),
                'cajaAperEstado': opening.cajaAperEstado,
                'ventas_count': ventas_count,
                'ventas_total': float(ventas_total)
            })
        
        return Response({
            'cash_openings': cash_openings_list,
            'is_manager': is_manager
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_seller_sales_history(request):
    """Historial de ventas por vendedor con filtros"""
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    branch_id = request.GET.get('branch_id')
    seller_id = request.GET.get('seller_id')
    client_id = request.GET.get('client_id')
    sale_type = request.GET.get('sale_type')
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    
    queryset = Venta.objects.exclude(ventEstado='ANULADO')
    
    if start_date:
        queryset = queryset.filter(ventFecha__gte=start_date)
    if end_date:
        queryset = queryset.filter(ventFecha__lte=end_date)
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    if is_manager:
        if branch_id:
            queryset = queryset.filter(sucurCod_id=branch_id)
    else:
        queryset = queryset.filter(sucurCod_id=user.sucurCod)
    
    if seller_id:
        queryset = queryset.filter(usuCod_id=seller_id)
    
    if sale_type:
        queryset = queryset.filter(ventFormaPago=sale_type)
    
    total_count = queryset.count()
    total_pages = (total_count + page_size - 1) // page_size
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    sales = queryset.select_related(
        'usuCod', 'sucurCod'
    ).order_by('-ventFecha')[start_idx:end_idx]
    
    sales_data = []
    for sale in sales:
        sales_data.append({
            'ventCod': sale.ventCod,
            'ventFecha': sale.ventFecha,
            'usuCod': sale.usuCod.usuCod if sale.usuCod else None,
            'usuNombreCom': sale.usuCod.usuNombreCom if sale.usuCod else 'N/A',
            'cliNombreCom': sale.cliNombreCom or 'N/A',
            'cliDocNum': sale.cliDocNum or 'N/A',
            'sucurCod': sale.sucurCod.sucurCod if sale.sucurCod else None,
            'sucurNom': sale.sucurCod.sucurNom if sale.sucurCod else 'N/A',
            'ventFormaPago': sale.ventFormaPago,
            'ventTotal': float(sale.ventTotal),
            'ventEstado': sale.ventEstado,
        })
    
    # Calcular resumen si se filtró por vendedor
    summary = None
    if seller_id:
        summary_stats = queryset.aggregate(
            total_amount=Sum('ventTotal'),
            total_sales=Count('ventCod'),
            average_sale=Avg('ventTotal')
        )
        summary = {
            'total_amount': float(summary_stats['total_amount'] or 0),
            'total_sales': summary_stats['total_sales'] or 0,
            'average_sale': float(summary_stats['average_sale'] or 0)
        }
    
    return Response({
        'sales': sales_data,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total_count,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        },
        'summary': summary,
        'is_manager': is_manager
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_seller_sales_history_csv(request):
    """Exportar historial de ventas por vendedor a CSV"""
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    branch_id = request.GET.get('branch_id')
    seller_id = request.GET.get('seller_id')
    client_id = request.GET.get('client_id')
    sale_type = request.GET.get('sale_type')
    
    queryset = Venta.objects.exclude(ventEstado='ANULADO')
    
    if start_date:
        queryset = queryset.filter(ventFecha__gte=start_date)
    if end_date:
        queryset = queryset.filter(ventFecha__lte=end_date)
    
    is_manager = user.roles.filter(rolNivel=0).exists()
    
    if is_manager:
        if branch_id:
            queryset = queryset.filter(sucurCod_id=branch_id)
    else:
        queryset = queryset.filter(sucurCod_id=user.sucurCod)
    
    if seller_id:
        queryset = queryset.filter(usuCod_id=seller_id)
    
    if sale_type:
        queryset = queryset.filter(ventFormaPago=sale_type)
    
    sales = queryset.select_related(
        'usuCod', 'sucurCod'
    ).order_by('-ventFecha')
    
    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = 'attachment; filename="historial_ventas_vendedor.csv"'
    response.write('\ufeff')
    
    writer = csv.writer(response)
    writer.writerow([
        'Código Venta',
        'Fecha',
        'Vendedor',
        'Cliente',
        'Documento Cliente',
        'Sucursal',
        'Tipo Venta',
        'Total',
        'Estado'
    ])
    
    for sale in sales:
        writer.writerow([
            sale.ventCod,
            sale.ventFecha.strftime('%Y-%m-%d'),
            sale.usuCod.usuNombreCom if sale.usuCod else 'N/A',
            sale.cliNombreCom or 'N/A',
            sale.cliDocNum or 'N/A',
            sale.sucurCod.sucurNom if sale.sucurCod else 'N/A',
            sale.ventFormaPago,
            float(sale.ventTotal),
            sale.ventEstado
        ])
    
    return response
