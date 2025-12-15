import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta
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
            await self.send_dashboard_data()
    
    async def send_dashboard_data(self):
        """Enviar datos del dashboard"""
        data = await self.get_dashboard_stats()
        
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': data,
            'timestamp': datetime.now().isoformat()
        }))
    
    @database_sync_to_async
    def get_dashboard_stats(self):
        """Obtener estadísticas del dashboard"""
        from inventory.models import Product, BranchInventory
        from Branch.models import Branch
        
        branch_filter = {}
        inventory_filter = {}
        
        if self.branch_id != 'all':
            branch_filter['branchOwner'] = int(self.branch_id)
            inventory_filter['sucurCod'] = int(self.branch_id)
        
        # Estadísticas de productos GLOBALES
        global_products = Product.objects.filter(prodOrigin='GLOBAL', prodEstado='Active').count()
        
        # Estadísticas de productos LOCALES de la sucursal
        local_products = Product.objects.filter(
            prodOrigin='LOCAL',
            prodEstado='Active',
            **branch_filter
        ).count()
        
        total_products = global_products + local_products
        
        # Inventario por sucursal
        if self.branch_id != 'all':
            # Stock bajo en esta sucursal
            low_stock_items = BranchInventory.objects.filter(
                **inventory_filter,
                invStock__lte=models.F('invStockMin'),
                invStock__gt=0
            )
            
            out_of_stock_items = BranchInventory.objects.filter(
                **inventory_filter,
                invStock=0
            )
            
            low_stock = low_stock_items.count()
            out_of_stock = out_of_stock_items.count()
            
            # Valor total del inventario
            total_stock_value = BranchInventory.objects.filter(
                **inventory_filter
            ).aggregate(
                total=Sum(models.F('invStock') * models.F('prodCod__prodCostoInv'))
            )['total'] or 0
            
            # Productos con poco stock (detalles)
            low_stock_products = []
            for item in low_stock_items[:10]:  # Top 10
                low_stock_products.append({
                    'prodCod': item.prodCod.prodCod,
                    'prodMarca': item.prodCod.prodMarca,
                    'prodDescr': item.prodCod.prodDescr[:50],
                    'currentStock': item.invStock,
                    'minStock': item.invStockMin,
                    'needsRestock': item.necesitaReposicion,
                    'prodBarcode': item.prodCod.prodBarcode,
                })
            
        else:
            # Vista de gerente: todos los productos
            low_stock = 0
            out_of_stock = 0
            total_stock_value = 0
            low_stock_products = []
            
            # Agregar estadísticas por sucursal
            for branch in Branch.objects.all():
                branch_low = BranchInventory.objects.filter(
                    sucurCod=branch,
                    invStock__lte=models.F('invStockMin'),
                    invStock__gt=0
                ).count()
                low_stock += branch_low
                
                branch_out = BranchInventory.objects.filter(
                    sucurCod=branch,
                    invStock=0
                ).count()
                out_of_stock += branch_out
        
        
        # Estadísticas de ventas (simulado)
        sales_today = 0
        revenue_today = 0
        
        # Egresos (basado en costo de productos agregados recientemente)
        from datetime import datetime, timedelta
        today = datetime.now().date()
        
        # Productos agregados hoy
        new_products_today = Product.objects.filter(
            created_at__date=today if hasattr(Product, 'created_at') else today
        ).aggregate(
            total_cost=Sum('prodCostoInv')
        )['total_cost'] or 0
        
        # Alertas
        alerts = []
        if low_stock > 0:
            alerts.append({
                'type': 'warning',
                'title': 'Stock Bajo',
                'message': f'{low_stock} productos requieren reabastecimiento',
                'priority': 'medium',
                'icon': '⚠️'
            })
        if out_of_stock > 0:
            alerts.append({
                'type': 'error',
                'title': 'Sin Stock',
                'message': f'{out_of_stock} productos agotados',
                'priority': 'high',
                'icon': '🚨'
            })
        
        # Información de sucursales (solo para gerente)
        branches_data = []
        if self.branch_id == 'all':
            branches = Branch.objects.all()
            for branch in branches:
                branch_inventory = BranchInventory.objects.filter(sucurCod=branch)
                total_items = branch_inventory.aggregate(Sum('invStock'))['invStock__sum'] or 0
                
                branches_data.append({
                    'sucurCod': branch.sucurCod,
                    'sucurNom': branch.sucurNom,
                    'sucurDirec': branch.sucurDir,
                    'total_items': total_items,
                    'low_stock': BranchInventory.objects.filter(
                        sucurCod=branch,
                        invStock__lte=models.F('invStockMin')
                    ).count(),
                })
        
        return {
            'inventory': {
                'total_products': total_products,
                'global_products': global_products,
                'local_products': local_products,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'total_value': float(total_stock_value),
                'low_stock_products': low_stock_products,
            },
            'sales': {
                'today': sales_today,
                'revenue_today': float(revenue_today),
            },
            'expenses': {
                'new_products_cost': float(new_products_today),
            },
            'alerts': alerts,
            'branches': branches_data,
        }
    
    async def dashboard_broadcast(self, event):
        """Recibir broadcast del grupo"""
        await self.send(text_data=json.dumps(event['data']))