import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Sum, Count, Q, F, Max
from datetime import datetime, timedelta, date
from decimal import Decimal
from django.db import models


class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Obtener parámetros de la URL
        self.user_id = self.scope['url_route']['kwargs'].get('user_id')
        self.branch_id = self.scope['url_route']['kwargs'].get('branch_id', 'all')
        
        # Nombre del grupo de canal
        self.room_group_name = f'dashboard_{self.user_id}_{self.branch_id}'
        
        # Unirse al grupo
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Enviar datos iniciales
        await self.send_dashboard_data()
    
    async def disconnect(self, close_code):
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Recibir mensaje del cliente"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'refresh':
            filters = data.get('filters', {})
            section = data.get('section', 'all')  # Permite actualizar solo una sección
            
            # Actualizar branch_id si viene en los filtros
            if 'branch_id' in filters:
                branch_id = filters.get('branch_id')
                self.branch_id = 'all' if branch_id is None else str(branch_id)
            
            await self.send_dashboard_data(filters, section)
    
    async def send_dashboard_data(self, filters=None, section='all'):
        """Enviar datos del dashboard"""
        data = await self.get_dashboard_stats(filters or {}, section)
        
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'section': section,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }))
    
    @database_sync_to_async
    def get_dashboard_stats(self, filters, section='all'):
        """Obtener estadísticas del dashboard según rol del usuario y sección específica"""
        from inventory.models import Product, BranchInventory
        from Branch.models import Branch
        from sales.models import Venta, VentaDetalle
        from User.models import User
        
        # Obtener usuario y sus roles
        try:
            user = User.objects.prefetch_related('roles').get(usuCod=self.user_id)
            user_roles = [role.rolNom for role in user.roles.all()]
            user_role_level = min([role.rolNivel for role in user.roles.all()]) if user.roles.exists() else 4
        except User.DoesNotExist:
            return {'error': 'Usuario no encontrado'}
        
        # Determinar filtros de sucursal
        branch_filter = {}
        inventory_filter = {}
        sales_filter = {}
        
        if self.branch_id != 'all':
            # Filtro de sucursal específica
            branch_id = int(self.branch_id)
            branch_filter['branchOwner'] = branch_id
            inventory_filter['sucurCod'] = branch_id
            sales_filter['sucurCod'] = branch_id
        elif self.branch_id == 'all' and user_role_level > 0:
            # Vista Global solo para gerentes (nivel 0)
            # Otros usuarios con sucursal asignada solo ven su sucursal
            if user.sucurCod:
                branch_filter['branchOwner'] = user.sucurCod.sucurCod
                inventory_filter['sucurCod'] = user.sucurCod.sucurCod
                sales_filter['sucurCod'] = user.sucurCod.sucurCod
        # Si branch_id == 'all' y user_role_level == 0: NO aplicar filtros = TODAS las sucursales
        
        # Construir respuesta según la sección solicitada
        result = {
            'user_role': user_roles[0] if user_roles else 'UNKNOWN',
            'user_role_level': user_role_level,
        }
        
        # Si se solicita todo o una sección específica
        if section == 'all' or section == 'inventory':
            result['inventory'] = self._get_inventory_stats(branch_filter, inventory_filter)
        
        if section == 'all' or section == 'sales':
            date_filter = self._build_date_filter(filters.get('sales_date_range', filters.get('date_range', 'today')))
            if user_role_level <= 2:
                result['sales'] = self._get_sales_stats(sales_filter, date_filter, user_role_level)
        
        # Gráfico de ventas con filtro independiente (usa su propio campo)
        if section == 'all' or section == 'sales_chart':
            date_filter = self._build_date_filter(filters.get('sales_chart_date_range', 'month'))
            if user_role_level <= 2:
                result['sales_chart'] = self._get_sales_stats(sales_filter, date_filter, user_role_level)
        
        if section == 'all' or section == 'earnings':
            date_filter = self._build_date_filter(filters.get('earnings_date_range', filters.get('date_range', 'today')))
            if user_role_level <= 2:
                result['earnings'] = self._get_earnings_stats(sales_filter, date_filter)
        
        if section == 'all' or section == 'expenses':
            date_filter = self._build_date_filter(filters.get('expenses_date_range', filters.get('date_range', 'today')))
            if user_role_level <= 2:
                result['expenses'] = self._get_expenses_stats(sales_filter, date_filter)
        
        if section == 'all' or section == 'frequent_clients':
            date_filter = self._build_date_filter(filters.get('clients_date_range', 'month'))
            if user_role_level <= 2:
                result['frequent_clients'] = self._get_frequent_clients(sales_filter, date_filter)
        
        if section == 'all' or section == 'sales_by_seller':
            date_filter = self._build_date_filter(filters.get('seller_date_range', filters.get('date_range', 'today')))
            if user_role_level <= 1:
                result['sales_by_seller'] = self._get_sales_by_seller(sales_filter, date_filter)
        
        if section == 'all' or section == 'branch_reports':
            date_filter = self._build_date_filter(filters.get('reports_date_range', filters.get('date_range', 'today')))
            if user_role_level == 0 and self.branch_id == 'all':
                result['branch_reports'] = self._get_branch_reports(date_filter)
        
        if section == 'all' or section == 'pending_sales':
            if user_role_level <= 2:
                result['pending_sales'] = self._get_pending_sales(sales_filter)
        
        if section == 'all' or section == 'orders':
            if user_role_level <= 2:
                result['orders'] = self._get_orders(sales_filter)
        
        # Datos específicos del usuario (para cajeros/vendedores)
        if section == 'all' or section == 'my_sales':
            date_filter = self._build_date_filter(filters.get('sales_date_range', filters.get('date_range', 'today')))
            result['my_sales_count'], result['my_earnings'] = self._get_my_sales(self.user_id, sales_filter, date_filter)
        
        if section == 'all' or section == 'my_pending_sales':
            result['my_pending_sales'] = self._get_my_pending_sales(self.user_id, sales_filter)
        
        if section == 'all' or section == 'ready_for_pickup':
            result['ready_for_pickup'], result['ready_for_pickup_list'] = self._get_ready_for_pickup(sales_filter)
        
        # Ventas pendientes (cuenta)
        if section == 'all' or section == 'pending_orders':
            result['pending_orders'] = self._get_pending_orders_count(sales_filter)
        
        if section == 'all' or section == 'alerts':
            inventory_stats = result.get('inventory', self._get_inventory_stats(branch_filter, inventory_filter))
            sales_stats = result.get('sales', {})
            result['alerts'] = self._generate_alerts(inventory_stats, sales_stats)
        
        if section == 'all' or section == 'branches':
            if user_role_level == 0 and self.branch_id == 'all':
                result['branches'] = self._get_branches_data()
        
        return result
    
    def _build_date_filter(self, date_range):
        """Construir filtro de fechas"""
        today = datetime.now().date()
        
        if date_range == 'today':
            start_date = datetime.combine(today, datetime.min.time())
            end_date = datetime.combine(today, datetime.max.time())
        elif date_range == 'week':
            start_date = datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time())
            end_date = datetime.now()
        elif date_range == 'month':
            start_date = datetime.combine(today.replace(day=1), datetime.min.time())
            end_date = datetime.now()
        elif date_range == 'year':
            start_date = datetime.combine(today.replace(month=1, day=1), datetime.min.time())
            end_date = datetime.now()
        else:
            start_date = datetime.combine(today, datetime.min.time())
            end_date = datetime.combine(today, datetime.max.time())
        
        return {'start': start_date, 'end': end_date, 'range': date_range}
    
    def _get_inventory_stats(self, branch_filter, inventory_filter):
        """Obtener estadísticas de inventario"""
        from inventory.models import Product, BranchInventory
        
        # Productos activos
        global_products = Product.objects.filter(prodOrigin='GLOBAL', prodEstado='Active').count()
        local_products = Product.objects.filter(prodOrigin='LOCAL', prodEstado='Active', **branch_filter).count()
        total_products = global_products + local_products
        
        # Stock bajo y agotado
        if inventory_filter:
            low_stock_items = BranchInventory.objects.filter(
                **inventory_filter,
                invStock__lte=F('invStockMin'),
                invStock__gt=0
            )
            out_of_stock_items = BranchInventory.objects.filter(**inventory_filter, invStock=0)
            total_stock_value = BranchInventory.objects.filter(**inventory_filter).aggregate(
                total=Sum(F('invStock') * F('prodCod__prodCostoInv'))
            )['total'] or 0
            
            low_stock_products = [{
                'prodCod': item.prodCod.prodCod,
                'prodMarca': item.prodCod.prodMarca,
                'prodDescr': item.prodCod.prodDescr[:50],
                'currentStock': item.invStock,
                'minStock': item.invStockMin,
            } for item in low_stock_items[:10]]
        else:
            from Branch.models import Branch
            low_stock = 0
            out_of_stock = 0
            total_stock_value = 0
            low_stock_products = []
            
            for branch in Branch.objects.all():
                low_stock += BranchInventory.objects.filter(
                    sucurCod=branch, invStock__lte=F('invStockMin'), invStock__gt=0
                ).count()
                out_of_stock += BranchInventory.objects.filter(sucurCod=branch, invStock=0).count()
            
            low_stock_items = type('obj', (object,), {'count': lambda self: low_stock})()
            out_of_stock_items = type('obj', (object,), {'count': lambda self: out_of_stock})()
        
        return {
            'total_products': total_products,
            'global_products': global_products,
            'local_products': local_products,
            'low_stock': low_stock_items.count(),
            'out_of_stock': out_of_stock_items.count(),
            'total_value': float(total_stock_value),
            'low_stock_products': low_stock_products,
        }
    
    def _get_sales_stats(self, sales_filter, date_filter, user_role_level):
        """Obtener estadísticas de ventas"""
        from sales.models import Venta
        
        base_query = Venta.objects.filter(
            ventFecha__gte=date_filter['start'],
            ventFecha__lte=date_filter['end'],
            ventAnulada=False,
            **sales_filter
        )
        
        total_sales = base_query.count()
        total_revenue = base_query.aggregate(Sum('ventTotal'))['ventTotal__sum'] or 0
        total_profit = base_query.aggregate(Sum('ventTotal'))['ventTotal__sum'] or 0
        
        # Ventas por estado de pago
        paid_sales = base_query.filter(ventEstado='PAGADO').count()
        pending_sales = base_query.filter(ventEstado='PENDIENTE').count()
        partial_sales = base_query.filter(ventEstado='PARCIAL').count()
        
        # Ventas agrupadas por período (para gráfico de líneas)
        daily_sales = []
        date_range = date_filter.get('range', 'week')  # today, week, month, year
        
        # Determinar el agrupamiento según el rango
        if date_range == 'today':
            # Día: Agrupar por DÍAS de la semana actual (Lun, Mar, Mié... Dom)
            from django.db.models.functions import TruncDate
            
            sales_by_period = base_query.annotate(
                period=TruncDate('ventFecha')
            ).values('period').annotate(
                total=Sum('ventTotal')
            )
            
            # Crear diccionario con ventas
            sales_dict = {item['period']: float(item['total'] or 0) for item in sales_by_period}
            
            # Llenar todos los días de la semana (7 días)
            today = datetime.now().date()
            start_of_week = today - timedelta(days=today.weekday())  # Lunes
            
            dias_semana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
            
            for i in range(7):
                day = start_of_week + timedelta(days=i)
                daily_sales.append({
                    'date': f'{dias_semana[i]} {day.day}',
                    'total': sales_dict.get(day, 0)
                })
                
        elif date_range == 'week':
            # Semana: Agrupar por DÍAS del mes actual (1, 2, 3... 30/31)
            from django.db.models.functions import TruncDate
            import calendar
            
            sales_by_period = base_query.annotate(
                period=TruncDate('ventFecha')
            ).values('period').annotate(
                total=Sum('ventTotal')
            )
            
            # Crear diccionario con ventas
            sales_dict = {item['period']: float(item['total'] or 0) for item in sales_by_period}
            
            # Llenar TODOS los días del mes actual
            today = datetime.now().date()
            year = today.year
            month = today.month
            days_in_month = calendar.monthrange(year, month)[1]
            
            for day in range(1, days_in_month + 1):
                date_obj = datetime(year, month, day).date()
                daily_sales.append({
                    'date': f'{day}',
                    'total': sales_dict.get(date_obj, 0)
                })
                
        elif date_range == 'month':
            # Mes: Agrupar por MESES del año actual (Enero, Febrero... Diciembre)
            from django.db.models.functions import TruncMonth
            
            # Obtener ventas del año actual
            current_year = datetime.now().year
            year_sales = Venta.objects.filter(
                ventFecha__year=current_year,
                ventAnulada=False,
                **sales_filter
            )
            
            sales_by_period = year_sales.annotate(
                period=TruncMonth('ventFecha')
            ).values('period').annotate(
                total=Sum('ventTotal')
            )
            
            # Crear diccionario con ventas por mes
            sales_dict = {item['period'].month: float(item['total'] or 0) for item in sales_by_period}
            
            # Nombres de meses en español
            meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
            
            # Llenar TODOS los meses del año (1-12)
            for mes_num in range(1, 13):
                daily_sales.append({
                    'date': meses[mes_num - 1],
                    'total': sales_dict.get(mes_num, 0)
                })
                
        elif date_range == 'year':
            # Año: Agrupar por AÑOS (2020, 2021, 2022... 2025)
            from django.db.models.functions import TruncYear
            
            # Obtener todas las ventas históricas
            all_sales = Venta.objects.filter(
                ventAnulada=False,
                **sales_filter
            )
            
            sales_by_period = all_sales.annotate(
                period=TruncYear('ventFecha')
            ).values('period').annotate(
                total=Sum('ventTotal')
            ).order_by('period')
            
            # Extraer años con ventas
            for item in sales_by_period:
                daily_sales.append({
                    'date': str(item['period'].year),
                    'total': float(item['total'] or 0)
                })
        else:
            # Por defecto: últimos 7 días
            from django.db.models.functions import TruncDate
            sales_by_period = base_query.annotate(
                period=TruncDate('ventFecha')
            ).values('period').annotate(
                total=Sum('ventTotal')
            )
            
            sales_dict = {item['period']: float(item['total'] or 0) for item in sales_by_period}
            
            today = datetime.now().date()
            for i in range(7):
                day = today - timedelta(days=6-i)
                daily_sales.append({
                    'date': day.strftime('%d/%m'),
                    'total': sales_dict.get(day, 0)
                })
        
        return {
            'total': total_sales,
            'revenue': float(total_revenue),
            'profit': float(total_profit),
            'paid': paid_sales,
            'pending': pending_sales,
            'partial': partial_sales,
            'daily_sales': daily_sales,
        }
    
    def _get_frequent_clients(self, sales_filter, date_filter):
        """Obtener clientes más frecuentes"""
        from sales.models import Venta
        
        clients = Venta.objects.filter(
            ventFecha__gte=date_filter['start'],
            ventFecha__lte=date_filter['end'],
            ventAnulada=False,
            **sales_filter
        ).values('cliNombreCom', 'cliDocNum').annotate(
            total_compras=Count('ventCod'),
            total_gastado=Sum('ventTotal')
        ).order_by('-total_compras')[:10]
        
        return [{
            'nombre': c['cliNombreCom'],
            'documento': c['cliDocNum'],
            'compras': c['total_compras'],
            'total': float(c['total_gastado'] or 0)
        } for c in clients]
    
    def _get_sales_by_seller(self, sales_filter, date_filter):
        """Obtener ventas agrupadas por vendedor"""
        from sales.models import Venta
        from collections import defaultdict
        
        sales = Venta.objects.filter(
            ventFecha__gte=date_filter['start'],
            ventFecha__lte=date_filter['end'],
            ventAnulada=False,
            **sales_filter
        ).select_related('usuCod', 'cajaAperCod', 'sucurCod').order_by('usuCod', '-ventFecha')
        
        # Agrupar ventas por vendedor
        sellers_dict = defaultdict(lambda: {
            'vendedor': None,
            'vendedor_id': None,
            'sucursal': None,
            'total_ventas': 0,
            'total_monto': 0,
            'ventas': []
        })
        
        for sale in sales:
            seller_id = sale.usuCod.usuCod
            
            # Inicializar datos del vendedor si es la primera vez
            if sellers_dict[seller_id]['vendedor'] is None:
                sellers_dict[seller_id]['vendedor'] = sale.usuCod.usuNombreCom
                sellers_dict[seller_id]['vendedor_id'] = seller_id
                sellers_dict[seller_id]['sucursal'] = sale.sucurCod.sucurNom if sale.sucurCod else 'N/A'
            
            # Agregar venta al vendedor
            sellers_dict[seller_id]['total_ventas'] += 1
            sellers_dict[seller_id]['total_monto'] += float(sale.ventTotal)
            sellers_dict[seller_id]['ventas'].append({
                'ventCod': sale.ventCod,
                'ventFecha': sale.ventFecha.strftime('%Y-%m-%d %H:%M'),
                'caja': sale.cajaAperCod.cajCod.cajNom if sale.cajaAperCod else 'N/A',
                'ventTotal': float(sale.ventTotal)
            })
        
        # Convertir a lista ordenada por total de monto (descendente)
        result = sorted(
            sellers_dict.values(),
            key=lambda x: x['total_monto'],
            reverse=True
        )
        
        return result
    
    def _get_branch_reports(self, date_filter):
        """Obtener reportes por sucursal (solo gerente)"""
        from sales.models import Venta
        from Branch.models import Branch
        from inventory.models import BranchInventory
        
        branches = Branch.objects.all()
        reports = []
        
        for branch in branches:
            # Ventas de la sucursal
            sales = Venta.objects.filter(
                sucurCod=branch,
                ventFecha__gte=date_filter['start'],
                ventFecha__lte=date_filter['end'],
                ventAnulada=False
            )
            
            total_sales = sales.count()
            total_revenue = sales.aggregate(Sum('ventTotal'))['ventTotal__sum'] or 0
            
            # Inventario de la sucursal
            inventory = BranchInventory.objects.filter(sucurCod=branch)
            total_products = inventory.count()
            low_stock = inventory.filter(invStock__lte=models.F('invStockMin')).count()
            
            reports.append({
                'sucursal_id': branch.sucurCod,
                'sucursal': branch.sucurNom,  # Frontend espera 'sucursal'
                'total_ventas': total_sales,
                'total_ingresos': float(total_revenue),  # Frontend espera 'total_ingresos'
                'total_productos': total_products,
                'low_stock': low_stock,
            })
        
        return reports
    
    def _get_pending_sales(self, sales_filter):
        """Obtener ventas pendientes o con estados especiales"""
        from sales.models import Venta
        
        pending = Venta.objects.filter(
            Q(ventEstado='PENDIENTE') | Q(ventEstado='PARCIAL') | Q(ventEstadoRecoj__in=['PENDIENTE', 'LABORATORIO', 'LISTO']),
            ventAnulada=False,
            **sales_filter
        ).order_by('-ventFecha')[:20]
        
        return [{
            'ventCod': v.ventCod,
            'cliente': v.cliNombreCom,
            'estado_venta': v.ventEstado,
            'estado_recojo': v.ventEstadoRecoj,
            'precio_total': float(v.ventTotal),
            'restante': float(v.ventSaldo),
            'fecha': v.ventFecha.strftime('%Y-%m-%d %H:%M')
        } for v in pending]
    
    def _get_orders(self, sales_filter):
        """Obtener pedidos por recoger y pendientes"""
        from sales.models import Venta
        
        orders_to_pickup = Venta.objects.filter(
            ventEstadoRecoj='LISTO',
            ventAnulada=False,
            **sales_filter
        ).count()
        
        orders_pending = Venta.objects.filter(
            ventEstadoRecoj__in=['PENDIENTE', 'LABORATORIO'],
            ventAnulada=False,
            **sales_filter
        ).count()
        
        return {
            'to_pickup': orders_to_pickup,
            'pending': orders_pending
        }
    
    def _generate_alerts(self, inventory_stats, sales_stats):
        """Generar alertas"""
        alerts = []
        
        if inventory_stats['low_stock'] > 0:
            alerts.append({
                'type': 'warning',
                'title': 'Stock Bajo',
                'message': f'{inventory_stats["low_stock"]} productos requieren reabastecimiento',
                'priority': 'medium',
            })
        
        if inventory_stats['out_of_stock'] > 0:
            alerts.append({
                'type': 'error',
                'title': 'Sin Stock',
                'message': f'{inventory_stats["out_of_stock"]} productos agotados',
                'priority': 'high',
            })
        
        if sales_stats.get('pending', 0) > 5:
            alerts.append({
                'type': 'info',
                'title': 'Ventas Pendientes',
                'message': f'{sales_stats["pending"]} ventas pendientes de pago',
                'priority': 'low',
            })
        
        return alerts
    
    def _get_earnings_stats(self, sales_filter, date_filter):
        """Obtener estadísticas de ganancias"""
        from sales.models import Venta
        
        base_query = Venta.objects.filter(
            ventFecha__gte=date_filter['start'],
            ventFecha__lte=date_filter['end'],
            ventAnulada=False,
            ventEstado='PAGADO',
            **sales_filter
        )
        
        total_earnings = base_query.aggregate(Sum('ventTotal'))['ventTotal__sum'] or 0
        total_profit = base_query.aggregate(Sum('ventTotal'))['ventTotal__sum'] or 0
        count = base_query.count()
        
        # Ganancias por día
        daily_earnings = []
        for i in range(7):
            day = datetime.now().date() - timedelta(days=6-i)
            earnings = Venta.objects.filter(
                ventFecha__date=day,
                ventAnulada=False,
                ventEstado='PAGADO',
                **sales_filter
            ).aggregate(Sum('ventTotal'))['ventTotal__sum'] or 0
            daily_earnings.append({
                'date': day.strftime('%Y-%m-%d'),
                'amount': float(earnings)
            })
        
        return {
            'total': float(total_earnings),
            'profit': float(total_profit),
            'count': count,
            'daily': daily_earnings,
        }
    
    def _get_expenses_stats(self, sales_filter, date_filter):
        """Obtener estadísticas de egresos (gastos por compra de inventario)"""
        from inventory.models import Product, BranchInventory
        from django.db.models import Sum, F, DecimalField, Count
        from django.db.models.functions import Coalesce
        
        # Determinar filtro de sucursal
        inventory_filter = {}
        if 'sucurCod' in sales_filter:
            inventory_filter['sucurCod'] = sales_filter['sucurCod']
        
        # Obtener productos creados en el rango de fechas (nuevas compras)
        new_products = Product.objects.filter(
            created_at__gte=date_filter['start'],
            created_at__lte=date_filter['end'],
            prodEstado='Active'
        )
        
        # Si hay filtro de sucursal, filtrar productos
        if inventory_filter:
            # Productos globales o locales de esa sucursal
            new_products = new_products.filter(
                Q(prodOrigin='GLOBAL') | Q(branchOwner=inventory_filter.get('sucurCod'))
            )
        
        # Calcular gasto total por productos nuevos
        # (cantidad en inventario * costo unitario)
        total_expenses = 0
        expenses_by_category = {}
        product_count = 0
        
        for product in new_products:
            # Obtener inventario del producto
            if inventory_filter:
                inventories = BranchInventory.objects.filter(
                    prodCod=product,
                    **inventory_filter
                )
            else:
                inventories = BranchInventory.objects.filter(prodCod=product)
            
            for inventory in inventories:
                expense = float(inventory.invStock * product.prodCostoInv)
                total_expenses += expense
                product_count += 1
                
                # Agrupar por categoría
                category = product.catproCod.catproNom
                if category not in expenses_by_category:
                    expenses_by_category[category] = 0
                expenses_by_category[category] += expense
        
        # Convertir categorías a lista
        categories = [
            {'category': cat, 'amount': round(amt, 2)}
            for cat, amt in expenses_by_category.items()
        ]
        
        # Gastos diarios (últimos 7 días)
        daily_expenses = []
        for i in range(7):
            day = datetime.now().date() - timedelta(days=6-i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())
            
            # Productos creados ese día
            day_products = Product.objects.filter(
                created_at__gte=day_start,
                created_at__lte=day_end,
                prodEstado='Active'
            )
            
            if inventory_filter:
                day_products = day_products.filter(
                    Q(prodOrigin='GLOBAL') | Q(branchOwner=inventory_filter.get('sucurCod'))
                )
            
            day_total = 0
            for product in day_products:
                if inventory_filter:
                    inventories = BranchInventory.objects.filter(
                        prodCod=product,
                        **inventory_filter
                    )
                else:
                    inventories = BranchInventory.objects.filter(prodCod=product)
                
                for inventory in inventories:
                    day_total += float(inventory.invStock * product.prodCostoInv)
            
            daily_expenses.append({
                'date': day.strftime('%Y-%m-%d'),
                'amount': round(day_total, 2)
            })
        
        return {
            'total': round(total_expenses, 2),
            'count': product_count,
            'categories': categories,
            'daily': daily_expenses,
        }
    
    def _get_branches_data(self):
        """Obtener datos de sucursales (solo gerente)"""
        from Branch.models import Branch
        from inventory.models import BranchInventory
        from sales.models import Venta
        
        branches = Branch.objects.all()
        branches_data = []
        
        today = datetime.now().date()
        
        for branch in branches:
            branch_inventory = BranchInventory.objects.filter(sucurCod=branch)
            total_items = branch_inventory.aggregate(Sum('invStock'))['invStock__sum'] or 0
            
            sales_today = Venta.objects.filter(
                sucurCod=branch,
                ventFecha__date=today,
                ventAnulada=False
            ).aggregate(Sum('ventTotal'))['ventTotal__sum'] or 0
            
            branches_data.append({
                'sucurCod': branch.sucurCod,
                'sucurNom': branch.sucurNom,
                'sucurDirec': branch.sucurDir,
                'total_items': total_items,
                'low_stock': BranchInventory.objects.filter(
                    sucurCod=branch,
                    invStock__lte=F('invStockMin')
                ).count(),
                'sales_today': float(sales_today),
            })
        
        return branches_data
    
    def _get_my_sales(self, user_id, sales_filter, date_filter):
        """Obtener mis ventas (del usuario actual)"""
        from sales.models import Venta
        
        my_sales = Venta.objects.filter(
            usuCod=user_id,
            ventFecha__gte=date_filter['start'],
            ventFecha__lte=date_filter['end'],
            ventAnulada=False,
            **sales_filter
        )
        
        count = my_sales.count()
        total_earnings = my_sales.aggregate(Sum('ventTotal'))['ventTotal__sum'] or 0
        
        return count, float(total_earnings)
    
    def _get_my_pending_sales(self, user_id, sales_filter):
        """Obtener mis ventas pendientes (del usuario actual)"""
        from sales.models import Venta
        
        my_pending = Venta.objects.filter(
            usuCod=user_id,
            ventAnulada=False,
            **sales_filter
        ).filter(
            Q(ventEstado='PENDIENTE') | Q(ventEstado='PARCIAL')
        ).order_by('-ventFecha')[:20]
        
        return [{
            'ventCod': v.ventCod,
            'cliente': v.cliNombreCom,
            'estado_venta': v.ventEstado,
            'estado_recojo': v.ventEstadoRecoj,
            'precio_total': float(v.ventTotal),
            'restante': float(v.ventSaldo),
            'fecha': v.ventFecha.strftime('%Y-%m-%d %H:%M')
        } for v in my_pending]
    
    def _get_ready_for_pickup(self, sales_filter):
        """Obtener pedidos listos para recoger"""
        from sales.models import Venta
        
        ready = Venta.objects.filter(
            ventEstadoRecoj='LISTO',
            ventAnulada=False,
            **sales_filter
        ).order_by('-ventFecha')[:20]
        
        ready_list = [{
            'ventCod': v.ventCod,
            'cliente': v.cliNombreCom,
            'precio_total': float(v.ventTotal),
            'fecha': v.ventFecha.strftime('%Y-%m-%d %H:%M')
        } for v in ready]
        
        return len(ready_list), ready_list
    
    def _get_pending_orders_count(self, sales_filter):
        """Obtener cantidad de pedidos pendientes"""
        from sales.models import Venta
        
        return Venta.objects.filter(
            Q(ventEstado='PENDIENTE') | Q(ventEstado='PARCIAL'),
            ventAnulada=False,
            **sales_filter
        ).count()
    
    async def dashboard_broadcast(self, event):
        """Recibir broadcast del grupo"""
        await self.send(text_data=json.dumps(event['data']))