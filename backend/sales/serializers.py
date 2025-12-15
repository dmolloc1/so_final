from rest_framework import serializers
from decimal import Decimal
from .models import Venta, VentaDetalle, Comprobante, ComprobanteDetalle
from inventory.models import Product, BranchInventory
from cash.models import CashOpening
from User.models import User
from Branch.models import Branch
from django.db import transaction

###################################################################################
# SERIALIZERS PARA VENTA
###################################################################################

class VentaDetalleSerializer(serializers.ModelSerializer):
    """Serializer para detalles de venta"""
    prodCod = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    producto_nombre = serializers.CharField(source='prodCod.prodDescr', read_only=True)
    producto_marca = serializers.CharField(source='prodCod.prodMarca', read_only=True)
    producto_codigo = serializers.CharField(source='prodCod.prodCod', read_only=True)
    producto_unidadMed = serializers.CharField(source='prodCod.prodUnidadMedi', read_only=True)
    class Meta:
        model = VentaDetalle
        fields = [
            'ventDetCod', 'prodCod', 'producto_nombre', 'producto_marca', 'producto_codigo', 'producto_unidadMed',
            'ventDetCantidad', 'ventDetValorUni', 'ventDetPrecioUni', 'ventDetSubtotal',
            'ventDetIGV', 'ventDetTotal', 'ventDetDescuento', 'ventDetAnulado',
            'ventDetDescripcion', 'ventDetMarca'
        ]
        read_only_fields = [
            'ventDetCod', 'ventDetValorUni', 'ventDetPrecioUni', 'ventDetSubtotal',
            'ventDetIGV', 'ventDetTotal', 'ventDetDescripcion', 'ventDetMarca'
        ]

class VentaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar ventas"""
    vendedor_nombre = serializers.CharField(source='usuCod.get_full_name', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucurCod.sucurNom', read_only=True)
    estado_display = serializers.CharField(source='get_ventEstado_display', read_only=True)
    estado_recojo_display = serializers.CharField(source='get_ventEstadoRecoj_display', read_only=True)
    
    class Meta:
        model = Venta
        fields = [
            'ventCod', 'ventFecha', 'cliNombreCom', 'cliDocTipo', 'cliDocNum',
            'ventTotal', 'ventEstado', 'estado_display', 'ventEstadoRecoj', 'estado_recojo_display',
            'ventFormaPago', 'vendedor_nombre', 'sucursal_nombre'
        ]

class VentaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear ventas con detalles"""
    detalles = VentaDetalleSerializer(many=True, write_only=True)



    usuCod = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            roles__rolNom__in=['VENDEDOR', 'CAJERO']
        ).distinct() 
    )

    sucurCod = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    cajaAperCod = serializers.PrimaryKeyRelatedField(
        queryset=CashOpening.objects.filter(cajaAperEstado='ABIERTA'),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Venta
        fields = [
            'ventCod', 'usuCod', 'sucurCod', 'cajaAperCod',
            'cliNombreCom', 'cliDocTipo', 'cliDocNum', 'cliDireccion',
            'ventFechaEntrega', 'ventObservaciones', 'ventFormaPago',
            'ventReferenciaPago', 'ventTarjetaTipo', 'detalles'
        ]
    
    def validate(self, data):
        """Validaciones personalizadas para la venta"""
        # Validar dirección para RUC
        if data.get('cliDocTipo') == 'RUC' and not data.get('cliDireccion', '').strip():
            raise serializers.ValidationError({
                'cliDireccion': 'La dirección es obligatoria para clientes con RUC.'
            })
        
        # Validar detalles
        detalles = data.get('detalles', [])
        if not detalles:
            raise serializers.ValidationError({
                'detalles': 'La venta debe tener al menos un producto.'
            })
        
        # Validar stock para cada producto
        sucurCod = data.get('sucurCod')
        for detalle in detalles:
            producto = detalle['prodCod']
            cantidad = detalle['ventDetCantidad']
            
            # Verificar stock
            inventario = BranchInventory.objects.filter(
                prodCod=producto,
                sucurCod=sucurCod
            ).first()
            
            if not inventario or inventario.invStock < cantidad:
                raise serializers.ValidationError({
                    'detalles': f'Stock insuficiente para {producto.prodDescr}. Disponible: {inventario.invStock if inventario else 0}'
                })
        
        return data
    
    def create(self, validated_data):
        """Crear venta con sus detalles"""
        detalles_data = validated_data.pop('detalles')
        
        with transaction.atomic():
            # Crear venta
            venta = Venta.objects.create(**validated_data)
            
            for detalle_data in detalles_data:
                # Extraer solo los campos que no son read_only
                campos_creacion = {
                    'ventCod': venta,
                    'prodCod': detalle_data['prodCod'],
                    'ventDetCantidad': detalle_data['ventDetCantidad'],
                    'ventDetDescuento': detalle_data.get('ventDetDescuento', 0)
                }
                
                # Crear el detalle - los campos read_only se calcularán automáticamente
                detalle = VentaDetalle(**campos_creacion)
                detalle.save()  # Esto ejecutará _copiar_datos_producto() y _calcular_totales()
            
            # Calcular totales de la venta
            venta.calcular_totales()
            venta.save()
            
            return venta

class VentaUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar ventas (solo campos editables)"""
    class Meta:
        model = Venta
        fields = [
            'ventFechaEntrega', 'ventObservaciones', 'ventFormaPago',
            'ventReferenciaPago', 'ventTarjetaTipo'
        ]
    
    def update(self, instance, validated_data):
        """Actualizar venta y recalcular totales si es necesario"""
        venta = super().update(instance, validated_data)
        venta.calcular_totales()
        venta.save()
        return venta

class VentaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para ventas con toda la información"""
    detalles = VentaDetalleSerializer(many=True, read_only=True)
    vendedor_nombre = serializers.CharField(source='usuCod.get_full_name', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucurCod.sucurNom', read_only=True)
    caja_nombre = serializers.CharField(source='cajaAperCod.cajaDenominacion', read_only=True)
    estado_display = serializers.CharField(source='get_ventEstado_display', read_only=True)
    estado_recojo_display = serializers.CharField(source='get_ventEstadoRecoj_display', read_only=True)
    forma_pago_display = serializers.CharField(source='get_ventFormaPago_display', read_only=True)
    tarjeta_tipo_display = serializers.CharField(source='get_ventTarjetaTipo_display', read_only=True)
    
    # Información del comprobante si existe
    comprobante = serializers.SerializerMethodField()
    
    class Meta:
        model = Venta
        fields = [
            # Información básica
            'ventCod', 'ventFecha', 'ventFechaEntrega',
            
            # Datos del cliente
            'cliNombreCom', 'cliDocTipo', 'cliDocNum', 'cliDireccion',
            
            # Estados
            'ventEstado', 'estado_display', 'ventEstadoRecoj', 'estado_recojo_display',
            'ventAnulada', 'ventMotivoAnulacion',
            
            # Totales
            'ventSubTotal', 'ventIGV', 'ventTotal', 'ventTotalGravada',
            'ventTotalInafecta', 'ventTotalExonerada', 'ventTotalGratuita',
            'ventAdelanto', 'ventSaldo',
            
            # Pago
            'ventFormaPago', 'forma_pago_display', 'ventReferenciaPago',
            'ventTarjetaTipo', 'tarjeta_tipo_display',
            
            # Observaciones
            'ventObservaciones',
            
            # Relaciones
            'usuCod', 'vendedor_nombre', 'sucurCod', 'sucursal_nombre',
            'cajaAperCod', 'caja_nombre',
            
            # Detalles y comprobante
            'detalles', 'comprobante'
        ]
    
    def get_comprobante(self, obj):
        """Obtener información del comprobante si existe"""
        if hasattr(obj, 'comprobante'):
            return ComprobanteListSerializer(obj.comprobante).data
        return None

###################################################################################
# SERIALIZERS PARA PAGOS
###################################################################################

class PagoSerializer(serializers.Serializer):
    """Serializer para registrar pagos en ventas"""
    monto = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01") )
    forma_pago = serializers.ChoiceField(choices=Venta.FORMA_PAGO)
    referencia_pago = serializers.CharField(max_length=50, required=False, allow_blank=True)
    tarjeta_tipo = serializers.ChoiceField(
        choices=Venta.TIPO_TARJETA, 
        required=False, 
        allow_blank=True
    )
    
    def validate(self, data):
        """Validaciones para el pago"""
        venta = self.context.get('venta')
        monto = data['monto']
        forma_pago = data['forma_pago']
        
        if venta.ventAnulada:
            raise serializers.ValidationError("No se puede registrar pago en una venta anulada.")
        
        if monto > venta.ventSaldo:
            raise serializers.ValidationError(
                f"El monto (S/{monto}) excede el saldo pendiente (S/{venta.ventSaldo})"
            )
        
        # Validar referencia para métodos electrónicos
        if forma_pago in ['TRANSFERENCIA', 'YAPE', 'PLIN'] and not data.get('referencia_pago'):
            raise serializers.ValidationError({
                'referencia_pago': f'Debe proporcionar una referencia de pago para {forma_pago}.'
            })
        
        # Validar tipo de tarjeta
        if forma_pago == 'TARJETA' and not data.get('tarjeta_tipo'):
            raise serializers.ValidationError({
                'tarjeta_tipo': 'Debe especificar el tipo de tarjeta para pagos con tarjeta.'
            })
        
        return data

class AnularVentaSerializer(serializers.Serializer):
    """Serializer para anular ventas"""
    motivo = serializers.CharField(max_length=500, min_length=5)
    
    def validate_motivo(self, value):
        """Validar que el motivo no esté vacío"""
        if not value.strip():
            raise serializers.ValidationError("El motivo de anulación no puede estar vacío.")
        return value

###################################################################################
# SERIALIZERS PARA COMPROBANTE
###################################################################################

class ComprobanteDetalleSerializer(serializers.ModelSerializer):
    """Serializer para detalles de comprobante"""
    producto_nombre = serializers.CharField(source='prodCod.prodDescr', read_only=True)
    producto_codigo = serializers.CharField(source='prodCod.prodCod', read_only=True)
    
    class Meta:
        model = ComprobanteDetalle
        fields = [
            'comprDetCod', 'prodCod', 'producto_nombre', 'producto_codigo',
            'comprDetDescripcion', 'comprDetMarca', 'comprDetCantidad',
            'comprDetValorUni', 'comprDetPrecioUni', 'comprDetSubtotal',
            'comprDetIGV', 'comprDetDescuento', 'comprDetTotal', 'comprDetTipoIGV'
        ]
        read_only_fields = [
            'comprDetCod', 'comprDetDescripcion', 'comprDetMarca', 'comprDetCantidad',
            'comprDetValorUni', 'comprDetPrecioUni', 'comprDetSubtotal', 'comprDetIGV',
            'comprDetDescuento', 'comprDetTotal', 'comprDetTipoIGV'
        ]

class ComprobanteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar comprobantes"""
    comprobante_completo = serializers.CharField( read_only=True)
    tipo_display = serializers.CharField(source='get_comprTipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_comprEstadoSUNAT_display', read_only=True)
    venta_codigo = serializers.IntegerField(source='ventCod.ventCod', read_only=True)
    cliente_nombre = serializers.CharField(source='comprRazonSocialReceptor', read_only=True)
    
    class Meta:
        model = Comprobante
        fields = [
            'comprCod', 'comprobante_completo', 'comprTipo', 'tipo_display',
            'comprFechaEmision', 'comprTotalVenta', 'comprEstadoSUNAT', 'estado_display',
            'venta_codigo', 'cliente_nombre', 'comprRUCEmisor', 'comprNumDocReceptor'
        ]

class ComprobanteDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para comprobantes"""
    detalles = ComprobanteDetalleSerializer(many=True, read_only=True)
    tipo_display = serializers.CharField(source='get_comprTipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_comprEstadoSUNAT_display', read_only=True)
    estado_completo = serializers.CharField(source='get_estado_display_completo', read_only=True)
    moneda_display = serializers.CharField(source='get_comprMoneda_display', read_only=True)
    tipo_doc_display = serializers.CharField(source='get_comprTipoDocReceptor_display', read_only=True)
    tiene_cdr = serializers.BooleanField(read_only=True)
    url_descarga_cdr = serializers.CharField(read_only=True)
    url_descarga_xml = serializers.CharField(read_only=True)
    
    # Información de la venta asociada
    venta_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Comprobante
        fields = [
            # Información básica
            'comprCod', 'comprTipo', 'tipo_display', 'comprSerie', 'comprCorrelativo',
            'comprobante_completo', 'comprFechaEmision',
            
            # Datos del emisor
            'comprRUCEmisor', 'comprRazonSocialEmisor', 'comprDireccionEmisor',
            
            # Datos del receptor
            'comprTipoDocReceptor', 'tipo_doc_display', 'comprNumDocReceptor',
            'comprRazonSocialReceptor', 'comprDireccionReceptor',
            
            # Información monetaria
            'comprMoneda', 'moneda_display', 'comprTotalGravadas', 'comprTotalExoneradas',
            'comprTotalInafectas', 'comprTotalIGV', 'comprTotalVenta',
            
            # Estado SUNAT
            'comprEstadoSUNAT', 'estado_display', 'estado_completo', 'comprMensajeSUNAT',
            'comprCodigoRespuesta', 'comprHash', 'comprNombreCDR',
            'comprFechaEnvio', 'comprFechaRespuesta',
            
            # URLs de descarga
            'tiene_cdr', 'url_descarga_cdr', 'url_descarga_xml',
            
            # Detalles y venta
            'detalles', 'venta_info'
        ]

        read_only_fields = [
            'comprCod', 'comprTipo', 'comprSerie', 'comprCorrelativo', 
            'comprFechaEmision', 'comprRUCEmisor', 'comprRazonSocialEmisor', 
            'comprDireccionEmisor', 'comprTipoDocReceptor', 'comprNumDocReceptor', 
            'comprRazonSocialReceptor', 'comprDireccionReceptor', 'comprMoneda', 
            'comprTotalGravadas', 'comprTotalExoneradas', 'comprTotalInafectas', 
            'comprTotalIGV', 'comprTotalVenta', 'comprEstadoSUNAT', 'comprMensajeSUNAT'
        ]
    
    def get_venta_info(self, obj):
        """Obtener información básica de la venta asociada"""
        venta = obj.ventCod
        return {
            'venta_codigo': venta.ventCod,
            'fecha_venta': venta.ventFecha,
            'vendedor': venta.usuCod.usuNom,
            'sucursal': venta.sucurCod.sucurNom,
            'estado_venta': venta.get_ventEstado_display()
        }

class ComprobanteCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear comprobantes manualmente (si es necesario)"""
    ventCod = serializers.PrimaryKeyRelatedField(
        queryset=Venta.objects.filter(ventEstado='PAGADO', ventAnulada=False),
        help_text="Solo se pueden generar comprobantes para ventas pagadas y no anuladas"
    )
    
    class Meta:
        model = Comprobante
        fields = ['ventCod']
        read_only_fields = [
            'comprTipo', 'comprSerie', 'comprCorrelativo', 'comprFechaEmision',
            'comprRUCEmisor', 'comprRazonSocialEmisor', 'comprDireccionEmisor',
            'comprTipoDocReceptor', 'comprNumDocReceptor', 'comprRazonSocialReceptor',
            'comprDireccionReceptor', 'comprTotalGravadas', 'comprTotalExoneradas',
            'comprTotalInafectas', 'comprTotalGratuitas', 'comprTotalIGV', 'comprTotalVenta'
        ]
    
    def validate_ventCod(self, value):
        """Validar que la venta sea apta para generar comprobante"""
        if hasattr(value, 'comprobante'):
            raise serializers.ValidationError("Esta venta ya tiene un comprobante generado.")
        
        if value.ventEstado != 'PAGADO':
            raise serializers.ValidationError("Solo se pueden generar comprobantes para ventas pagadas.")
        
        if value.ventAnulada:
            raise serializers.ValidationError("No se pueden generar comprobantes para ventas anuladas.")
        
        return value
    
    def create(self, validated_data):
        """Crear comprobante - los datos se generan automáticamente"""
        venta = validated_data['ventCod']
        
        # Verificar nuevamente que no tenga comprobante
        if hasattr(venta, 'comprobante'):
            raise serializers.ValidationError("Esta venta ya tiene un comprobante generado.")
        
        # Crear comprobante (los datos se llenan automáticamente en save())
        comprobante = Comprobante.objects.create(ventCod=venta)
        return comprobante

###################################################################################
# SERIALIZERS PARA REPORTES Y CONSULTAS
###################################################################################

class VentaReporteSerializer(serializers.ModelSerializer):
    """Serializer para reportes de ventas"""
    vendedor = serializers.CharField(source='usuCod.get_full_name', read_only=True)
    sucursal = serializers.CharField(source='sucurCod.sucurNom', read_only=True)
    estado_display = serializers.CharField(source='get_ventEstado_display', read_only=True)
    forma_pago_display = serializers.CharField(source='get_ventFormaPago_display', read_only=True)
    comprobante = serializers.SerializerMethodField()
    
    class Meta:
        model = Venta
        fields = [
            'ventCod', 'ventFecha', 'cliNombreCom', 'cliDocTipo', 'cliDocNum',
            'ventTotal', 'ventEstado', 'estado_display', 'ventFormaPago', 'forma_pago_display',
            'vendedor', 'sucursal', 'comprobante'
        ]
    
    def get_comprobante(self, obj):
        if hasattr(obj, 'comprobante'):
            return obj.comprobante.comprobante_completo
        return 'SIN COMPROBANTE'

class EstadisticasVentasSerializer(serializers.Serializer):
    """Serializer para estadísticas de ventas"""
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2)
    cantidad_ventas = serializers.IntegerField()
    promedio_venta = serializers.DecimalField(max_digits=10, decimal_places=2)
    ventas_por_estado = serializers.DictField()
    ventas_por_forma_pago = serializers.DictField()
    ventas_por_sucursal = serializers.DictField()