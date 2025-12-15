from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ProductCategory, Product, BranchInventory
from .serializers import (
    BranchInventorySummarySerializer, 
    BranchInventorySerializer,
    LocalProductWithInventorySerializer,
    ProductWithInventorySerializer,
    ProductSerializer,
    ProductCategorySerializer,
)
from django_filters.rest_framework import DjangoFilterBackend
from .filters import ProductFilter
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db import transaction
from django.db import models
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user

        # Base: solo productos ACTIVOS
        base_filter = Product.objects.filter(prodEstado="Active")

        # 🔍 NUEVO: Filtro por código de barras si se proporciona
        barcode = self.request.GET.get('prodBarcode')
        if barcode:
            base_filter = base_filter.filter(prodBarcode=barcode)

        search_query = self.request.GET.get('search')
        if search_query:
            base_filter = base_filter.filter(
                models.Q(prodDescr__icontains=search_query) |
                models.Q(prodMarca__icontains=search_query) |
                models.Q(prodCod__icontains=search_query)
            )

        # Supervisor: solo ve GLOBAL + LOCAL de su sucursal
        if getattr(user, "sucurCod", None):
            suc = user.sucurCod
            return (
                base_filter.filter(
                    models.Q(prodOrigin="LOCAL", branchOwner=suc) |
                    models.Q(prodOrigin="GLOBAL")
                )
                .select_related("branchOwner", "catproCod", "provCod")
                .distinct()
            )
        

        # Gerente: ve TODO lo activo
        return base_filter.select_related("branchOwner", "catproCod", "provCod")

    def perform_create(self, serializer):
        """Crea productos según el rol del usuario."""
        user = self.request.user
        
        # 🔍 DEBUG (puedes quitarlo después)
        print(f"🔍 Usuario: {user.usuNom}")
        roles_nombres = [r.rolNom for r in user.roles.all()]
        print(f"🔍 Roles: {roles_nombres}")
        
        # ✅ Verificar si es GERENTE por sus roles (many-to-many)
        if user.roles.filter(rolNom='GERENTE').exists():
            print("✅ Creando producto GLOBAL (Gerente)")
            serializer.save(prodOrigin="GLOBAL", branchOwner=None)
            return
        
        # Supervisor crea productos LOCALES de su sucursal
        if hasattr(user, "sucurCod") and user.sucurCod:
            print(f"✅ Creando producto LOCAL en sucursal {user.sucurCod}")
            serializer.save(prodOrigin="LOCAL", branchOwner=user.sucurCod)
            return
        
        # Por defecto, GLOBAL (para usuarios sin rol específico)
        print("✅ Creando producto GLOBAL (por defecto)")
        serializer.save(prodOrigin="GLOBAL", branchOwner=None)

    @action(detail=True, methods=['get'], url_path='branch-stock')
    def branch_stock(self, request, pk=None):
        """Stock del producto por sucursal."""
        product = self.get_object()
        inventories = BranchInventory.objects.filter(prodCod=product)
        data = BranchInventorySerializer(inventories, many=True).data
        return Response(data)

    @action(detail=False, methods=['get'], url_path='central-stock')
    def central_stock(self, request):
        """Inventario central = suma de stock de SOLO productos GLOBALES."""
        productos_globales = Product.objects.filter(prodOrigin='GLOBAL')

        response = []
        for p in productos_globales:
            total = BranchInventory.objects.filter(prodCod=p).aggregate(
                total=models.Sum("invStock")
            )["total"] or 0

            response.append({
                "producto_id": p.prodCod,
                "producto": p.prodDescr,
                "marca": p.prodMarca,
                "total_stock_central": total,
                "barcode": p.prodBarcode
            })

        return Response(response)

    @action(detail=False, methods=['get'], url_path='local-products')
    def local_products(self, request):
        """
        Lista productos locales agrupados por sucursal.
        Solo para gerente.
        """
        productos_locales = Product.objects.filter(
            prodOrigin='LOCAL'
        ).select_related('branchOwner').order_by('branchOwner__sucurNom')

        response = []
        for p in productos_locales:
            stock = BranchInventory.objects.filter(
                prodCod=p,
                sucurCod=p.branchOwner
            ).first()

            response.append({
                "producto_id": p.prodCod,
                "producto": p.prodDescr,
                "marca": p.prodMarca,
                "sucursal": p.branchOwner.sucurNom if p.branchOwner else "N/A",
                "stock": stock.invStock if stock else 0,
                "barcode": p.prodBarcode
            })

        return Response(response)

    @action(detail=True, methods=['post'])
    def regenerate_barcode(self, request, pk=None):
        product = self.get_object()
        
        product.prodBarcode = None
        product.generate_barcode()
        
        serializer = self.get_serializer(product)
        return Response({
            'success': True,
            'message': 'Código de barras regenerado',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='dashboard-summary')
    def dashboard_summary(self, request):
        """
        Dashboard para gerente:
        - Total productos globales
        - Total productos locales por sucursal
        - Inventario central
        - Productos con bajo stock
        """
        from Branch.models import Branch
        
        total_global = Product.objects.filter(prodOrigin='GLOBAL').count()
        
        sucursales = Branch.objects.all()
        locales_por_sucursal = []
        
        for suc in sucursales:
            count = Product.objects.filter(prodOrigin='LOCAL', branchOwner=suc).count()
            locales_por_sucursal.append({
                "sucursal": suc.sucurNom,
                "productos_locales": count
            })
        
        # Stock bajo
        low_stock = BranchInventory.objects.filter(
            invStock__lte=models.F('invStockMin')
        ).select_related('prodCod', 'sucurCod')[:10]
        
        return Response({
            "productos_globales_total": total_global,
            "productos_locales_por_sucursal": locales_por_sucursal,
            "alertas_stock_bajo": BranchInventorySerializer(low_stock, many=True).data
        })

    @action(detail=False, methods=['get'], url_path='by-branch/(?P<branch_id>[0-9]+)')
    def by_branch(self, request, branch_id=None):
        from Branch.models import Branch
        
        try:
            sucursal = Branch.objects.get(sucurCod=branch_id)
        except Branch.DoesNotExist:
            return Response(
                {"error": f"Sucursal {branch_id} no encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 🔍 NUEVO: Obtener parámetros de filtro
        barcode_filter = request.GET.get('barcode')
        search_filter = request.GET.get('search')
        
        inventarios = BranchInventory.objects.filter(
            sucurCod=sucursal
        ).select_related('prodCod', 'prodCod__catproCod', 'prodCod__provCod')
        
        # 🔍 NUEVO: Aplicar filtros si existen
        if barcode_filter:
            inventarios = inventarios.filter(prodCod__prodBarcode=barcode_filter)
        
        if search_filter:
            inventarios = inventarios.filter(
                models.Q(prodCod__prodDescr__icontains=search_filter) |
                models.Q(prodCod__prodMarca__icontains=search_filter)
            )
        
        response = []
        for inv in inventarios:
            producto = inv.prodCod
            
            # Solo incluir productos activos
            if producto.prodEstado != 'Active':
                continue
                
            response.append({
                "producto_id": producto.prodCod,
                "barcode": producto.prodBarcode,
                "descripcion": producto.prodDescr,
                "marca": producto.prodMarca,
                "material": producto.prodMate,
                "publico": producto.prodPublico,
                "origen": producto.prodOrigin,
                "precio_venta_sin_igv": float(producto.prodValorUni),
                "precio_venta_con_igv": float(producto.precioVentaConIGV),
                "stock_disponible": inv.invStock,
                "stock_minimo": inv.invStockMin,
                "bajo_stock": inv.is_low_stock,
                "categoria": producto.catproCod.catproNom if producto.catproCod else "",
                "proveedor": producto.provCod.provRazSocial if producto.provCod else "",
                "proveedor_id": producto.provCod.provCod if producto.provCod else None,
                "estado": producto.prodEstado
            })
        
        return Response({
            "sucursal_id": sucursal.sucurCod,
            "sucursal_nombre": sucursal.sucurNom,
            "total_productos": len(response),
            "productos": response
        })

    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        """Desactiva un producto sin eliminarlo (soft delete)."""
        product = self.get_object()

        # Si ya está inactivo
        if product.prodEstado == "Inactive":
            return Response({"message": "El producto ya está inactivo."}, status=200)

        product.prodEstado = "Inactive"
        product.save()

        return Response({
            "success": True,
            "message": "Producto desactivado correctamente",
            "product_id": product.prodCod
        }, status=200)
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        """Activa un producto."""
        product = self.get_object()

        if product.prodEstado == "Active":
            return Response({"message": "El producto ya está activo."}, status=200)

        product.prodEstado = "Active"
        product.save()

        return Response({
            "success": True,
            "message": "Producto activado correctamente",
            "product_id": product.prodCod
        })


class BranchInventoryViewSet(viewsets.ModelViewSet):
    serializer_class = BranchInventorySerializer
    queryset = BranchInventory.objects.all()

    def get_queryset(self):
        """Supervisor ve solo su sucursal; gerente ve todo."""
        user = self.request.user

        if hasattr(user, "sucurCod") and user.sucurCod:
            return BranchInventory.objects.filter(sucurCod=user.sucurCod)

        return BranchInventory.objects.all()

    def perform_create(self, serializer):
        """
        ✅ CORREGIDO: Validación simplificada
        """
        user = self.request.user
        producto = serializer.validated_data.get('prodCod')

        if hasattr(user, "sucurCod") and user.sucurCod:
            # Validar que si es producto local, sea de su sucursal
            if producto.prodOrigin == 'LOCAL' and producto.branchOwner != user.sucurCod:
                raise DRFValidationError({
                    'prodCod': 'No puedes crear inventario de productos locales de otras sucursales'
                })
            
            serializer.save(sucurCod=user.sucurCod)
            return

        # Gerente puede crear inventario en cualquier sucursal
        serializer.save()

    @action(detail=True, methods=['patch'], url_path='update-stock')
    def update_stock(self, request, pk=None):
        """Actualizar stock sencillo."""
        inventario = self.get_object()

        nuevo = request.data.get("invStock")
        if nuevo is None or int(nuevo) < 0:
            return Response(
                {"error": "Stock inválido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        inventario.invStock = int(nuevo)
        inventario.save()

        return Response({
            "success": True,
            "data": self.get_serializer(inventario).data
        })