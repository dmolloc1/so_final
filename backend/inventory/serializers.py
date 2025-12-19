from rest_framework import serializers
from .models import ProductCategory, Product, BranchInventory
from Branch.models import Branch
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    # Campos calculados (read-only)
    precioVentaConIGV = serializers.SerializerMethodField()
    margenGanancia = serializers.SerializerMethodField()
    montoIGV = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    
    # Información adicional (opcional)
    sucursal_nombre = serializers.CharField(
        source='branchOwner.sucurNom', 
        read_only=True,
        allow_null=True
    )
    categoria_nombre = serializers.CharField(
        source='catproCod.catproNom',
        read_only=True
    )
    proveedor_nombre = serializers.CharField(
        source='provCod.provNom',
        read_only=True
    )

    class Meta:
        model = Product
        fields = '__all__'

    def get_precioVentaConIGV(self, obj):
        return float(obj.precioVentaConIGV or 0)

    def get_margenGanancia(self, obj):
        return float(obj.margenGanancia or 0)
    
    def get_montoIGV(self, obj):
        return float(obj.montoIGV or 0)

    def validate(self, attrs):
        """
        Validación adicional:
        - No permitir cambiar prodOrigin después de creado
        - No permitir cambiar branchOwner después de creado
        """
        if self.instance:  # Si es UPDATE
            # No permitir cambiar el origen
            if 'prodOrigin' in attrs and attrs['prodOrigin'] != self.instance.prodOrigin:
                raise serializers.ValidationError({
                    'prodOrigin': 'No se puede cambiar el origen del producto después de creado.'
                })
            
            # No permitir cambiar la sucursal propietaria
            if 'branchOwner' in attrs and attrs['branchOwner'] != self.instance.branchOwner:
                raise serializers.ValidationError({
                    'branchOwner': 'No se puede cambiar la sucursal propietaria después de creado.'
                })
        
        return attrs


class ProductWithInventorySerializer(serializers.ModelSerializer):
    precioVentaConIGV = serializers.SerializerMethodField()
    margenGanancia = serializers.SerializerMethodField()
    inventario = serializers.SerializerMethodField()
    
    sucursal_nombre = serializers.CharField(
        source='branchOwner.sucurNom', 
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Product
        fields = [
            'prodCod', 'prodBarcode', 'prodDescr', 'prodMarca', 
            'prodMate', 'prodPublico', 'prodCostoInv', 'prodValorUni',
            'precioVentaConIGV', 'margenGanancia', 'prodTipoAfecIGV',
            'prodUnidadMedi', 'prodOrigin', 'prodEstado',
            'catproCod', 'provCod', 'branchOwner', 'sucursal_nombre',
            'inventario'
        ]

    def get_precioVentaConIGV(self, obj):
        return float(obj.precioVentaConIGV or 0)

    def get_margenGanancia(self, obj):
        return float(obj.margenGanancia or 0)
    
    def get_inventario(self, obj):
        """Obtiene el inventario del producto en cada sucursal."""
        inventarios = BranchInventory.objects.filter(prodCod=obj).select_related('sucurCod')
        return [{
            'sucursal_id': inv.sucurCod.sucurCod,
            'sucursal_nombre': inv.sucurCod.sucurNom,
            'stock': inv.invStock,
            'stock_minimo': inv.invStockMin,
            'bajo_stock': inv.is_low_stock,
            'necesita_reposicion': inv.necesitaReposicion
        } for inv in inventarios]


class LocalProductWithInventorySerializer(serializers.ModelSerializer):
    # Campos para crear el inventario inicial
    sucurCod = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        write_only=True,
        required=True,
        help_text="Sucursal donde existirá este producto local"
    )
    invStock = serializers.IntegerField(
        write_only=True, 
        min_value=0,
        required=True,
        help_text="Stock inicial del producto"
    )
    invStockMin = serializers.IntegerField(
        write_only=True, 
        default=5,
        min_value=0,
        help_text="Stock mínimo antes de alerta"
    )

    # Campo de respuesta
    inventario_creado = serializers.SerializerMethodField()
    
    # Campos calculados
    precioVentaConIGV = serializers.SerializerMethodField()
    margenGanancia = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            # Campos del producto
            'prodCod', 'prodBarcode', 'prodDescr', 'prodMarca', 
            'prodMate', 'prodPublico', 'prodCostoInv', 'prodValorUni',
            'prodTipoAfecIGV', 'prodUnidadMedi', 'prodEstado',
            'catproCod', 'provCod',
            # Campos calculados
            'precioVentaConIGV', 'margenGanancia',
            # Campos para inventario (write_only)
            'sucurCod', 'invStock', 'invStockMin',
            # Campos automáticos
            'prodOrigin', 'branchOwner', 'inventario_creado'
        ]
        read_only_fields = ['prodCod', 'prodBarcode', 'prodOrigin', 'branchOwner']

    def get_precioVentaConIGV(self, obj):
        return float(obj.precioVentaConIGV or 0)

    def get_margenGanancia(self, obj):
        return float(obj.margenGanancia or 0)

    def get_inventario_creado(self, obj):
        return getattr(obj, '_inventario_info', None)

    @transaction.atomic
    def create(self, validated_data):
        """
        Crea un producto LOCAL y su inventario inicial en una transacción atómica.
        """
        # Extraer datos de inventario
        sucur = validated_data.pop('sucurCod')
        stock = validated_data.pop('invStock')
        stock_min = validated_data.pop('invStockMin')

        # Forzar que sea LOCAL y pertenezca a la sucursal
        validated_data['prodOrigin'] = 'LOCAL'
        validated_data['branchOwner'] = sucur

        try:
            # Crear producto LOCAL
            producto = Product.objects.create(**validated_data)

            # Crear inventario solo para esta sucursal
            inventario = BranchInventory.objects.create(
                sucurCod=sucur,
                prodCod=producto,
                invStock=stock,
                invStockMin=stock_min
            )

            # Agregar info para la respuesta
            producto._inventario_info = {
                'mensaje': 'Producto local creado exitosamente',
                'producto_id': producto.prodCod,
                'producto_barcode': producto.prodBarcode,
                'sucursal_id': sucur.sucurCod,
                'sucursal_nombre': sucur.sucurNom,
                'stock_inicial': stock,
                'stock_minimo': stock_min,
                'inventario_id': inventario.id
            }

            return producto

        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        except Exception as e:
            raise serializers.ValidationError({
                'error': f'Error al crear producto local: {str(e)}'
            })


class BranchInventorySerializer(serializers.ModelSerializer):
    # Información del producto
    producto_id = serializers.IntegerField(source='prodCod.prodCod', read_only=True)
    producto_descripcion = serializers.CharField(source='prodCod.prodDescr', read_only=True)
    producto_marca = serializers.CharField(source='prodCod.prodMarca', read_only=True)
    producto_barcode = serializers.CharField(source='prodCod.prodBarcode', read_only=True)
    producto_origin = serializers.CharField(source='prodCod.prodOrigin', read_only=True)
    
    # Información de la sucursal propietaria (solo para productos locales)
    producto_branch_owner = serializers.SerializerMethodField()
    
    # Información de la sucursal del inventario
    sucursal_id = serializers.IntegerField(source='sucurCod.sucurCod', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucurCod.sucurNom', read_only=True)

    # Campos calculados
    valorTotalStock = serializers.SerializerMethodField()
    is_low_stock = serializers.BooleanField(read_only=True)
    necesitaReposicion = serializers.IntegerField(read_only=True)

    class Meta:
        model = BranchInventory
        fields = [
            'id',
            # FK's
            'sucurCod', 'prodCod',
            # Inventario
            'invStock', 'invStockMin',
            # Info del producto
            'producto_id', 'producto_descripcion', 'producto_marca',
            'producto_barcode', 'producto_origin', 'producto_branch_owner',
            # Info de la sucursal
            'sucursal_id', 'sucursal_nombre',
            # Calculados
            'valorTotalStock', 'is_low_stock', 'necesitaReposicion'
        ]

    def get_producto_branch_owner(self, obj):
        """Retorna la sucursal propietaria solo si es producto local."""
        if obj.prodCod.prodOrigin == 'LOCAL' and obj.prodCod.branchOwner:
            return obj.prodCod.branchOwner.sucurNom
        return None

    def get_valorTotalStock(self, obj):
        return float(obj.valorTotalStock or 0)

    def validate(self, attrs):
        """
        Validaciones adicionales al crear/actualizar inventario.
        """
        producto = attrs.get('prodCod', self.instance.prodCod if self.instance else None)
        sucursal = attrs.get('sucurCod', self.instance.sucurCod if self.instance else None)

        if producto and sucursal:
            # Validar que productos locales solo existan en su sucursal
            if producto.prodOrigin == 'LOCAL' and producto.branchOwner != sucursal:
                raise serializers.ValidationError({
                    'prodCod': f'Este producto local solo puede existir en {producto.branchOwner.sucurNom}'
                })

        return attrs


class BranchInventorySummarySerializer(serializers.Serializer):
    sucursal_id = serializers.IntegerField()
    sucursal_nombre = serializers.CharField()
    total_productos = serializers.IntegerField()
    total_stock = serializers.IntegerField()
    productos_bajo_stock = serializers.IntegerField()
    valor_total_inventario = serializers.DecimalField(max_digits=15, decimal_places=2)