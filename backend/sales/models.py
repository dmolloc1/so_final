from inventory.models import Product, BranchInventory
from cash.models import CashOpening
from User.models import User
from Branch.models import Branch
from decimal import Decimal, ROUND_HALF_UP
from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
import re

########################################################################## VENTA

class Venta(models.Model):
    ESTADO_VENTA = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADO', 'Pagado'),
        ('PARCIAL', 'Pago Parcial'),
        ('ANULADO', 'Anulado'),
    ]

    ESTADO_PEDIDO = [
        ('PENDIENTE', 'Pendiente'),
        ('LABORATORIO', 'En laboratorio'),
        ('LISTO', 'Listo para recoger'),
        ('ENTREGADO', 'Entregado'),
        ('ANULADO', 'Anulado'),
    ]

    FORMA_PAGO = [
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('YAPE', 'Yape'),
        ('PLIN', 'Plin'),
        ('MIXTO', 'Pago Mixto'),
    ]

    TIPO_TARJETA = [
        ('DEBITO', 'Débito'),
        ('CREDITO', 'Crédito'),
        ('', 'No Aplica'),
    ]

    # Campos principales
    ventCod = models.AutoField(primary_key=True, verbose_name="Código Venta")
    usuCod = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        limit_choices_to={'roles__rolNom__in': ['VENDEDOR', 'CAJERO']},
        verbose_name="Vendedor"
    )
    sucurCod = models.ForeignKey(
        Branch,
        on_delete=models.PROTECT,
        verbose_name="Sucursal"
    )
    cajaAperCod = models.ForeignKey(
        CashOpening,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Caja asociada"
    )

    # Datos del cliente (SIMPLIFICADO)
    cliNombreCom = models.CharField(max_length=200, default="CLIENTE GENÉRICO")
    cliDocTipo = models.CharField(
        max_length=10,
        choices=[('DNI', 'DNI'), ('RUC', 'RUC'), ('CE', 'Carnet Extranjería'), ('', 'No Especificado')],
        default='DNI'
    )
    cliDocNum = models.CharField(max_length=15, blank=True)
    
    # DIRECCIÓN: Solo obligatoria para facturas, opcional para boletas
    cliDireccion = models.CharField(
        max_length=200, 
        blank=True, 
        verbose_name="Dirección del Cliente",
        help_text="Obligatorio para facturas, opcional para boletas"
    )

    # Datos de la venta
    ventFecha = models.DateTimeField(default=timezone.now)
    ventFechaEntrega = models.DateField(null=True, blank=True)
    ventEstado = models.CharField(max_length=20, choices=ESTADO_VENTA, default='PENDIENTE')
    ventEstadoRecoj = models.CharField(max_length=20, choices=ESTADO_PEDIDO, default='PENDIENTE')
    
    # Totales
    ventSubTotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ventIGV = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ventTotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ventTotalGravada = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Gravada")
    ventTotalInafecta = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Inafecta")
    ventTotalExonerada = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Exonerada")
    ventTotalGratuita = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Gratuita")
    
    ventAdelanto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ventSaldo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ventObservaciones = models.TextField(blank=True)
    ventAnulada = models.BooleanField(default=False)
    ventMotivoAnulacion = models.TextField(blank=True)

    # Pago
    ventFormaPago = models.CharField(
        max_length=15,
        choices=FORMA_PAGO,
        default='EFECTIVO',
        verbose_name="Forma de Pago"
    )
    ventReferenciaPago = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Referencia de Pago"
    )
    ventTarjetaTipo = models.CharField(
        max_length=10,
        choices=TIPO_TARJETA,
        blank=True,
        verbose_name="Tipo de Tarjeta"
    )

    class Meta:
        db_table = 'venta'
        ordering = ['-ventFecha']
        indexes = [
            models.Index(fields=['-ventFecha']),
            models.Index(fields=['ventEstado']),
        ]

    def __str__(self):
        return f"Venta #{self.ventCod} - {self.cliNombreCom} - S/{self.ventTotal}"

    @property
    def requiere_direccion(self):
        return self.cliDocTipo == 'RUC'

    @transaction.atomic
    def anular_venta(self, motivo):
        """
        Anula la venta completa, devuelve stock y resetea totales.
        """
        if self.ventAnulada:
            raise ValidationError("La venta ya está anulada.")

        if self.ventEstadoRecoj == "ENTREGADO":
            raise ValidationError("No se puede anular una venta ya entregada.")
        
        # Anular comprobante si existe
        if hasattr(self, 'comprobante'):
            if self.comprobante.comprEstadoSUNAT in ['ENVIADO', 'ACEPTADO']:
                raise ValidationError(
                    "No se puede anular la venta porque el comprobante ya fue enviado/aceptado por SUNAT. "
                    "Debe generar una Nota de Crédito."
                )
            self.comprobante.comprEstadoSUNAT = 'ANULADO'
            self.comprobante.comprMensajeSUNAT = f"Anulado junto con venta: {motivo}"
            self.comprobante.save()

        # Devolver stock de todos los detalles
        detalles = self.ventadetalle_set.select_for_update().all()
        for detalle in detalles:
            if not detalle.ventDetAnulado:
                detalle.devolver_stock()
                detalle.ventDetAnulado = True
                detalle.save(update_fields=["ventDetAnulado"])

        # Marcar venta como anulada
        self.ventAnulada = True
        self.ventEstado = "ANULADO"
        self.ventEstadoRecoj = "ANULADO"
        self.ventMotivoAnulacion = motivo
        self.ventAdelanto = Decimal("0")

        # Reset totales
        self.ventSubTotal = Decimal("0")
        self.ventIGV = Decimal("0")
        self.ventTotal = Decimal("0")
        self.ventTotalGravada = Decimal("0")
        self.ventTotalInafecta = Decimal("0")
        self.ventTotalExonerada = Decimal("0")
        self.ventTotalGratuita = Decimal("0")
        self.ventSaldo = Decimal("0")

        self.save()
        
        print(f"✅ Venta #{self.ventCod} anulada: {motivo}")

    def enviar_a_laboratorio(self):
        """Envía la venta al laboratorio"""
        if self.ventAnulada:
            raise ValidationError("No puedes enviar una venta anulada al laboratorio.")
        self.ventEstadoRecoj = "LABORATORIO"
        self.ventFechaEntrega = timezone.now().date() + timedelta(days=5)
        self.calcular_totales()
        self.save()

    def marcar_listo_para_recoger(self):
        """Marca la venta como lista para recoger"""
        if self.ventAnulada:
            raise ValidationError("No puedes marcar como listo una venta anulada.")
        self.ventEstadoRecoj = "LISTO"
        self.calcular_totales()
        self.save()

    def marcar_entregado(self):
        """Marca la venta como entregada"""
        if self.ventAnulada:
            raise ValidationError("Una venta anulada no puede ser entregada.")
        if self.ventSaldo > 0:
            raise ValidationError("No puedes entregar una venta con saldo pendiente.")
        self.ventEstadoRecoj = "ENTREGADO"
        self.ventFechaEntrega = timezone.now().date()
        self.calcular_totales()
        self.save()

    @transaction.atomic
    def calcular_totales(self):
        detalles = self.ventadetalle_set.filter(ventDetAnulado=False)
        
        if not detalles.exists():
            self._reset_totales()
            return

        # Inicializar totales
        total_gravada = total_inafecta = total_exonerada = total_gratuita = igv_total = Decimal("0")

        for detalle in detalles:
            if detalle.prodCod.prodTipoAfecIGV == "10":  # Gravada
                total_gravada += detalle.ventDetSubtotal
                igv_total += detalle.ventDetIGV
            elif detalle.prodCod.prodTipoAfecIGV == "20":  # Exonerada
                total_exonerada += detalle.ventDetSubtotal
            elif detalle.prodCod.prodTipoAfecIGV == "30":  # Inafecta
                total_inafecta += detalle.ventDetSubtotal
            elif detalle.prodCod.prodTipoAfecIGV == "31":  # Gratuita
                total_gratuita += detalle.ventDetSubtotal

        subtotal = total_gravada + total_exonerada + total_inafecta + total_gratuita

        # Actualizar campos
        self.ventSubTotal = subtotal
        self.ventIGV = igv_total
        self.ventTotal = subtotal + igv_total
        self.ventTotalGravada = total_gravada
        self.ventTotalExonerada = total_exonerada
        self.ventTotalInafecta = total_inafecta
        self.ventTotalGratuita = total_gratuita
        self.ventSaldo = max(self.ventTotal - self.ventAdelanto, Decimal("0"))

        # Actualizar estado
        self._actualizar_estado()

    def _reset_totales(self):
        """Resetea todos los totales a cero"""
        campos_totales = [
            'ventSubTotal', 'ventIGV', 'ventTotal', 'ventTotalGravada',
            'ventTotalInafecta', 'ventTotalExonerada', 'ventTotalGratuita', 'ventSaldo'
        ]
        for campo in campos_totales:
            setattr(self, campo, Decimal("0"))
        self.ventEstado = "PENDIENTE"

    def _actualizar_estado(self):
        """Actualiza el estado según el pago"""
        if self.ventAnulada:
            self.ventEstado = "ANULADO"
        elif self.ventSaldo == Decimal("0") and self.ventTotal > Decimal("0"):
            self.ventEstado = "PAGADO"
        elif self.ventAdelanto > Decimal("0") and self.ventSaldo > Decimal("0"):
            self.ventEstado = "PARCIAL"
        else:
            self.ventEstado = "PENDIENTE"

    @transaction.atomic
    def registrar_pago(self, monto, forma_pago, referencia_pago='', tarjeta_tipo=''):
        
        print(f"🔍 registrar_pago - Venta: {self.ventCod}, Monto: {monto}")
        print(f"🔍 Caja asignada: {getattr(self.cajaAperCod, 'cajaAperCod', 'None')}, Estado: {getattr(self.cajaAperCod, 'cajaAperEstado', 'No asignada')}")

        if self.ventAnulada:
            raise ValidationError("No se puede registrar pago en una venta anulada.")
        
        monto = Decimal(str(monto))
        
        if monto <= 0:
            raise ValidationError("El monto del pago debe ser mayor a cero.")
        
        if monto > self.ventSaldo:
            raise ValidationError(f"El monto (S/{monto}) excede el saldo pendiente (S/{self.ventSaldo})")

        # ✅ ACTUALIZAR CAJA PRIMERO - BUSCAR SESIÓN ABIERTA ACTUAL
        sesion_caja_actual = CashOpening.objects.filter(
            usuCod=self.usuCod,
            cajCod__sucurCod=self.sucurCod,
            cajaAperEstado='ABIERTA'
        ).first()
        
        if not sesion_caja_actual:
            raise ValidationError("No hay una sesión de caja abierta para registrar el pago.")
        
        print(f"✅ Sesión de caja actual encontrada: {sesion_caja_actual.cajaAperCod}")
        
        # Actualizar la caja de la venta con la sesión actual
        if self.cajaAperCod != sesion_caja_actual:
            print(f"🔄 Actualizando caja de venta: {getattr(self.cajaAperCod, 'cajaAperCod', 'None')} -> {sesion_caja_actual.cajaAperCod}")
            self.cajaAperCod = sesion_caja_actual
        
        
        # Actualizar campos de pago
        self.ventAdelanto += monto
        self.ventFormaPago = forma_pago
        self.ventReferenciaPago = referencia_pago
        self.ventTarjetaTipo = tarjeta_tipo if forma_pago == 'TARJETA' else ''
        
        # Recalcular y guardar
        self.calcular_totales()
        self.save()
        
        # Generar comprobante si está totalmente pagado
        if self.ventSaldo == Decimal("0") and self.ventTotal > Decimal("0"):
            comprobante = self._generar_comprobante()
            return {
                "mensaje": f"Pago registrado: S/{monto}",
                "saldo_actual": float(self.ventSaldo),
                "estado": self.ventEstado,
                "comprobante": comprobante.comprobante_completo
            }
        
        return {
            "mensaje": f"Pago registrado: S/{monto}",
            "saldo_actual": float(self.ventSaldo),
            "estado": self.ventEstado
        }

    def _generar_comprobante(self):
        if hasattr(self, 'comprobante'):
            return self.comprobante

        # Serie y correlativo se manejan en Comprobante, NO en Venta
        comprobante = Comprobante.objects.create(ventCod=self)
        return comprobante

    def save(self, *args, **kwargs):
        """
        LÓGICA CORREGIDA:
        - SIEMPRE asignar sesión de caja al crear venta (si el usuario tiene una abierta)
        - No esperar a que haya adelanto para asignar
        """
        
        # ✅ ASIGNAR SESIÓN si es venta nueva O si no tiene sesión asignada
        if not self.cajaAperCod and self.usuCod and self.sucurCod:
            print(f"🔍 Buscando sesión de caja abierta para usuario: {self.usuCod}")
            
            # Buscar sesión abierta del usuario en la sucursal
            sesion_caja_abierta = CashOpening.objects.filter(
                usuCod=self.usuCod,
                cajCod__sucurCod=self.sucurCod,
                cajaAperEstado='ABIERTA'
            ).select_related('cajCod').first()
            
            if sesion_caja_abierta:
                print(f"✅ Sesión encontrada: {sesion_caja_abierta.cajaAperCod} - Caja: {sesion_caja_abierta.cajCod.cajNom}")
                self.cajaAperCod = sesion_caja_abierta
            else:
                # ⚠️ IMPORTANTE: Si no hay sesión abierta, NO podemos crear la venta
                # (o permitirla solo si ventAdelanto == 0)
                if self.ventAdelanto > 0:
                    raise ValidationError(
                        f"El usuario {self.usuCod} no tiene una sesión de caja abierta. "
                        "Debe abrir caja antes de registrar ventas con pago."
                    )
                else:
                    print("⚠️ No hay sesión de caja abierta, pero venta sin adelanto permitida")
        
        # DEBUG: Información de la sesión asignada
        if self.cajaAperCod:
            print(f"💰 Sesión asignada: {self.cajaAperCod.cajaAperCod}")
            print(f"📊 Estado: {self.cajaAperCod.cajaAperEstado}")
            print(f"🏪 Caja: {self.cajaAperCod.cajCod.cajNom}")
        else:
            print("⚠️ ADVERTENCIA: Venta sin sesión de caja asignada")

        # Validar y guardar
        self.full_clean()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()

        # Validar dirección para RUC
        if self.requiere_direccion and not self.cliDireccion.strip():
            raise ValidationError({
                'cliDireccion': 'La dirección es obligatoria para clientes con RUC.'
            })

        # Validar documento según tipo
        if self.cliDocTipo == 'RUC' and self.cliDocNum and not re.fullmatch(r'\d{11}', self.cliDocNum):
            raise ValidationError({'cliDocNum': 'El RUC debe tener 11 dígitos.'})
        elif self.cliDocTipo == 'DNI' and self.cliDocNum and not re.fullmatch(r'\d{8}', self.cliDocNum):
            raise ValidationError({'cliDocNum': 'El DNI debe tener 8 dígitos.'})

        # ✅ VALIDACIÓN MEJORADA: Solo si hay adelanto O si ya está asignada
        if self.ventAdelanto > 0 or self.cajaAperCod:
            
            # Si hay adelanto pero no hay caja, error crítico
            if self.ventAdelanto > 0 and not self.cajaAperCod:
                raise ValidationError({
                    'cajaAperCod': 'Se requiere una sesión de caja abierta para registrar pagos.'
                })
            
            # Si hay caja asignada, verificar que esté abierta
            if self.cajaAperCod:
                if self.cajaAperCod.cajaAperEstado != 'ABIERTA':
                    raise ValidationError({
                        'cajaAperCod': f'La sesión de caja #{self.cajaAperCod.cajaAperCod} no está abierta (Estado: {self.cajaAperCod.cajaAperEstado}).'
                    })
                
                # ✅ NUEVO: Verificar que el usuario tenga acceso a esa caja
                if self.cajaAperCod.usuCod != self.usuCod:
                    raise ValidationError({
                        'cajaAperCod': f'La sesión de caja pertenece a otro usuario ({self.cajaAperCod.usuCod}). No puedes usarla.'
                    })
                
                # ✅ NUEVO: Verificar sucursal
                if self.cajaAperCod.cajCod.sucurCod != self.sucurCod:
                    raise ValidationError({
                        'cajaAperCod': 'La sesión de caja pertenece a otra sucursal.'
                    })

################################################################################### VENTA_DETALLE

class VentaDetalle(models.Model):

    ventDetCod = models.AutoField(primary_key=True, verbose_name="Código Detalle")
    
    # Foreign Keys
    ventCod = models.ForeignKey(
        Venta, 
        on_delete=models.CASCADE,
        verbose_name="Venta"
    )
    prodCod = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name="Producto"
    )
    
    # Cantidades
    ventDetCantidad = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Cantidad"
    )
    
    ventDetValorUni = models.DecimalField(max_digits=10, decimal_places=2)
    ventDetPrecioUni = models.DecimalField(max_digits=10, decimal_places=2)

    ventDetSubtotal = models.DecimalField(max_digits=10, decimal_places=2)
    ventDetIGV = models.DecimalField(max_digits=10, decimal_places=2)
    ventDetTotal = models.DecimalField(max_digits=10, decimal_places=2)

    
    ventDetDescuento = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Descuento"
    )
    
    ventDetAnulado = models.BooleanField(default=False)

    ventDetDescripcion = models.CharField(max_length=500)
    ventDetMarca = models.CharField(max_length=100)
    
    _cantidad_original = None
    
    class Meta:
        db_table = "venta_detalle"
        ordering = ["ventDetCod"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._cantidad_original = self.ventDetCantidad if self.pk else None

    def __str__(self):
        return f"Det #{self.ventDetCod} - {self.prodCod.prodMarca} x{self.ventDetCantidad}"
    
    @transaction.atomic
    def clean(self):
        """Validación con protección contra race conditions"""
        super().clean()
        
        if not self.ventCod_id or not self.prodCod_id or self.ventDetAnulado:
            return

        # BLOQUEAR el inventario para evitar race conditions
        inventario = BranchInventory.objects.select_for_update().filter(
            prodCod=self.prodCod,
            sucurCod=self.ventCod.sucurCod
        ).first()

        if not inventario:
            raise ValidationError("Producto no disponible en esta sucursal")

        # Calcular stock disponible
        if self.pk and self._cantidad_original is not None:
            stock_disponible = inventario.invStock + self._cantidad_original
        else:
            stock_disponible = inventario.invStock

        if self.ventDetCantidad > stock_disponible:
            raise ValidationError(f"Stock insuficiente. Disponible: {stock_disponible}")
    
    @transaction.atomic
    def save(self, *args, **kwargs):
        """Método save mejorado para VentaDetalle"""
        
        # Guardar cantidad original para comparar después
        if self.pk:
            # Si ya existe, guardar la cantidad original para comparar
            original = VentaDetalle.objects.get(pk=self.pk)
            self._cantidad_original = original.ventDetCantidad
        else:
            self._cantidad_original = 0
        
        # Calcular campos automáticos si es nuevo o están vacíos
        needs_calculation = (
            not self.ventDetValorUni or 
            not self.ventDetPrecioUni or 
            not self.ventDetDescripcion or
            not self.ventDetMarca
        )
        
        if needs_calculation and self.prodCod:
            self._copiar_datos_producto()
            self._calcular_totales()
        
        # Validar
        self.full_clean()
        
        # Guardar
        super().save(*args, **kwargs)
        
        # Manejar stock (solo si no está anulado)
        if not self.ventDetAnulado:
            self._actualizar_stock()
        
        # Actualizar venta
        if self.ventCod_id:
            self.ventCod.calcular_totales()
            self.ventCod.save()
    
    def _copiar_datos_producto(self):
        """Copia precios e info del producto al momento de la venta."""
        self.ventDetValorUni = Decimal(self.prodCod.prodValorUni).quantize(Decimal("0.01"))
        self.ventDetPrecioUni = Decimal(self.prodCod.precioVentaConIGV).quantize(Decimal("0.01"))
        self.ventDetDescripcion = self.prodCod.prodDescr
        self.ventDetMarca = self.prodCod.prodMarca

    def _calcular_totales(self):
        """Calcula subtotal, IGV y total."""
        subtotal = Decimal(self.ventDetValorUni) * self.ventDetCantidad

        if self.prodCod.prodTipoAfecIGV == "10":
            igv = subtotal * Decimal("0.18")
        else:
            igv = Decimal("0.00")

        self.ventDetSubtotal = subtotal.quantize(Decimal("0.01"))
        self.ventDetIGV = igv.quantize(Decimal("0.01"))
        self.ventDetTotal = (self.ventDetSubtotal + self.ventDetIGV - self.ventDetDescuento).quantize(Decimal("0.01"))

    def _descontar_stock(self, cantidad):
        """Descuenta o devuelve stock (cantidad puede ser negativa)."""
        inventario = BranchInventory.objects.select_for_update().get(
            prodCod=self.prodCod,
            sucurCod=self.ventCod.sucurCod
        )
        inventario.invStock -= cantidad
        inventario.save(update_fields=["invStock"])

    @transaction.atomic
    def devolver_stock(self):
        """Devuelve stock al inventario cuando se anula un detalle."""
        inventario = BranchInventory.objects.select_for_update().get(
            prodCod=self.prodCod,
            sucurCod=self.ventCod.sucurCod
        )
        inventario.invStock += self.ventDetCantidad
        inventario.save(update_fields=["invStock"])

    
    def _actualizar_stock(self):
        """Actualiza el stock del producto en la sucursal"""
        if not self.ventDetAnulado and self.prodCod and self.ventCod.sucurCod:
            try:
                # Obtener o crear el inventario para esta sucursal
                inventario, created = BranchInventory.objects.get_or_create(
                    prodCod=self.prodCod,
                    sucurCod=self.ventCod.sucurCod,
                    defaults={'invStock': 0}
                )
                
                # Calcular la diferencia de stock
                if self.pk:  # Si ya existe (está siendo actualizado)
                    if hasattr(self, '_cantidad_original'):
                        diferencia = self._cantidad_original - self.ventDetCantidad
                    else:
                        diferencia = -self.ventDetCantidad  # Por defecto, restar
                else:  # Si es nuevo
                    diferencia = -self.ventDetCantidad
                
                # Actualizar stock
                inventario.invStock += diferencia
                inventario.save()
                
                print(f"✅ Stock actualizado: {self.prodCod.prodDescr} - Diferencia: {diferencia}, Stock actual: {inventario.invStock}")
                
            except BranchInventory.DoesNotExist:
                print(f"❌ No se encontró inventario para {self.prodCod.prodDescr} en la sucursal {self.ventCod.sucurCod}")
            except Exception as e:
                print(f"❌ Error actualizando stock: {e}")

################################################################################### COMPROBANTE

class Comprobante(models.Model):
    
    ESTADO_SUNAT = [
        ('PENDIENTE', 'Pendiente de envío'),
        ('ENVIADO', 'Enviado a SUNAT'),
        ('ACEPTADO', 'Aceptado por SUNAT'),
        ('OBSERVADO', 'Observado por SUNAT'),
        ('RECHAZADO', 'Rechazado por SUNAT'),
        ('ANULADO', 'Anulado'),
    ]

    TIPO_COMPROBANTE = [
        ('01', 'Factura'),
        ('03', 'Boleta de Venta'),
        ('07', 'Nota de Crédito'),
        ('08', 'Nota de Débito'),
    ]

    comprCod = models.AutoField(primary_key=True, verbose_name="Código Comprobante")
    
    # Relación con la venta
    ventCod = models.OneToOneField(
        Venta,
        on_delete=models.PROTECT,
        related_name='comprobante',
        verbose_name="Venta asociada"
    )

    # SERIE Y CORRELATIVO se manejan AQUÍ
    comprTipo = models.CharField(
        max_length=2,
        choices=TIPO_COMPROBANTE,
        verbose_name="Tipo de Comprobante"
    )
    comprSerie = models.CharField(max_length=4, verbose_name="Serie")
    comprCorrelativo = models.IntegerField(verbose_name="Correlativo")
    
    # Fechas
    comprFechaEmision = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Emisión")

    # Emisor (datos de la empresa/sucursal)
    comprRUCEmisor = models.CharField(max_length=11, verbose_name="RUC Emisor")
    comprRazonSocialEmisor = models.CharField(max_length=200, verbose_name="Razón Social Emisor")
    comprDireccionEmisor = models.CharField(max_length=255, default="SIN DIRECCION")


    # Receptor (cliente)
    comprTipoDocReceptor = models.CharField(
        max_length=1,
        choices=[('1', 'DNI'), ('6', 'RUC'), ('-', 'No Aplica')],
        verbose_name="Tipo Documento Receptor"
    )
    comprNumDocReceptor = models.CharField(max_length=15, verbose_name="Número Documento Receptor")
    comprRazonSocialReceptor = models.CharField(max_length=200, verbose_name="Razón Social Receptor")
    comprDireccionReceptor = models.TextField(blank=True, verbose_name="Dirección Receptor")

    # Totales
    comprMoneda = models.CharField(max_length=3, default='PEN', choices=[('PEN', 'Soles'), ('USD', 'Dólares')])
    comprTotalGravadas = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    comprTotalExoneradas = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    comprTotalInafectas = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    comprTotalIGV = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    comprTotalVenta = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Estado SUNAT
    comprEstadoSUNAT = models.CharField(max_length=20, choices=ESTADO_SUNAT, default='PENDIENTE')
    comprMensajeSUNAT = models.TextField(blank=True, verbose_name="Mensaje SUNAT")

    comprHash = models.CharField(
        max_length=100, 
        blank=True, 
        verbose_name="Hash del comprobante"
    )
    comprCodigoRespuesta = models.CharField(
        max_length=10, 
        blank=True, 
        verbose_name="Código de respuesta SUNAT"
    )
    comprNombreCDR = models.CharField(
        max_length=100, 
        blank=True, 
        verbose_name="Nombre archivo CDR"
    )
    comprFechaEnvio = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Fecha de envío a SUNAT"
    )
    comprFechaRespuesta = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Fecha respuesta SUNAT"
    )

    class Meta:
        db_table = 'comprobante'
        ordering = ['-comprFechaEmision']
        indexes = [
            models.Index(fields=['comprSerie', 'comprCorrelativo']),
            models.Index(fields=['comprEstadoSUNAT']),
        ]

    def __str__(self):
        return f"{self.get_comprTipo_display()} {self.comprobante_completo}"

    
    def enviar_a_sunat(self):
        """
        Envía el comprobante a SUNAT
        """
        from .sunat_client import SunatClient
        
        print(f"🚀 Iniciando envío a SUNAT para comprobante {self.comprobante_completo}")
        
        if self.comprEstadoSUNAT in ['ENVIADO', 'ACEPTADO']:
            raise ValidationError(f"El comprobante ya fue {self.get_comprEstadoSUNAT_display().lower()} a SUNAT")
        
        if not self.ventCod or self.ventCod.ventAnulada:
            raise ValidationError("No se puede enviar un comprobante de venta anulada")
        
        # Validar que tenga detalles
        if not self.detalles.exists():
            raise ValidationError("El comprobante no tiene detalles")
        
        try:
            # Crear cliente SUNAT
            sunat_client = SunatClient()
            print(f"🔧 Cliente SUNAT creado con URL: {sunat_client.base_url}")
            
            # Verificar conexión
            print("🔍 Verificando estado del servicio...")
            servicio_disponible = sunat_client.verificar_estado_servicio()
            
            if not servicio_disponible:
                error_msg = f"El servicio SUNAT no está disponible en {sunat_client.base_url}"
                print(f"❌ {error_msg}")
                raise ValidationError([error_msg])
            
            print("✅ Servicio SUNAT disponible, enviando comprobante...")
            
            # Enviar comprobante
            resultado = sunat_client.enviar_comprobante(self)
            
            # Actualizar estado según respuesta
            self.comprEstadoSUNAT = resultado['estado']
            self.comprMensajeSUNAT = resultado['mensaje']
            self.comprCodigoRespuesta = resultado['codigo_respuesta']
            self.comprHash = resultado.get('hash', '')
            self.comprFechaEnvio = timezone.now()
            
            if resultado['estado'] == 'ACEPTADO':
                self.comprNombreCDR = resultado.get('cdr_nombre', '')
                self.comprFechaRespuesta = timezone.now()
                
                # Guardar CDR y XML si están disponibles
                if resultado.get('cdr_base64'):
                    self._guardar_archivo_cdr(resultado['cdr_base64'])
                
                if resultado.get('xml_base64'):
                    self._guardar_archivo_xml(resultado['xml_base64'])
            
            self.save()
            
            # Log del envío
            print(f"✅ Comprobante {self.comprobante_completo} enviado a SUNAT: {resultado['estado']}")
            print(f"📝 Mensaje: {resultado['mensaje']}")
            
            return resultado
            
        except ValidationError as e:
            # Re-lanzar ValidationError sin modificar
            raise e
        except Exception as e:
            # Marcar como error
            self.comprEstadoSUNAT = 'RECHAZADO'
            self.comprMensajeSUNAT = f"Error al enviar: {str(e)}"
            self.comprFechaEnvio = timezone.now()
            self.save()
            
            print(f"❌ Error enviando comprobante a SUNAT: {str(e)}")
            raise ValidationError(f"Error al enviar a SUNAT: {str(e)}")



    def _guardar_archivo_cdr(self, cdr_base64):
        """
        Guarda el CDR en el sistema de archivos
        """
        try:
            from django.core.files.base import ContentFile
            import os
            
            # Decodificar base64
            cdr_content = base64.b64decode(cdr_base64)
            
            # Crear directorio si no existe
            cdr_dir = 'cdr_files'
            os.makedirs(cdr_dir, exist_ok=True)
            
            # Guardar archivo
            filename = f"R-{self.comprSerie}-{self.comprCorrelativo}.zip"
            filepath = os.path.join(cdr_dir, filename)
            
            with open(filepath, 'wb') as f:
                f.write(cdr_content)
                
            print(f"✅ CDR guardado: {filepath}")
            
        except Exception as e:
            print(f"⚠️ Error guardando CDR: {str(e)}")
    
    def _guardar_archivo_xml(self, xml_base64):
        """
        Guarda el XML en el sistema de archivos
        """
        try:
            from django.core.files.base import ContentFile
            import os
            
            # Decodificar base64
            xml_content = base64.b64decode(xml_base64)
            
            # Crear directorio si no existe
            xml_dir = 'xml_files'
            os.makedirs(xml_dir, exist_ok=True)
            
            # Guardar archivo
            filename = f"{self.comprSerie}-{self.comprCorrelativo}.xml"
            filepath = os.path.join(xml_dir, filename)
            
            with open(filepath, 'wb') as f:
                f.write(xml_content)
                
            print(f"✅ XML guardado: {filepath}")
            
        except Exception as e:
            print(f"⚠️ Error guardando XML: {str(e)}")
    
    def reenviar_a_sunat(self):
        """
        Reenvía el comprobante a SUNAT
        """
        # Resetear estado para permitir reenvío
        if self.comprEstadoSUNAT in ['ENVIADO', 'ACEPTADO']:
            self.comprEstadoSUNAT = 'PENDIENTE'
            self.comprMensajeSUNAT = 'Reenviando a SUNAT...'
            self.save()
        
        return self.enviar_a_sunat()
    
    def descargar_pdf(self):
        """
        Genera PDF del comprobante (puedes integrar con una librería de PDF)
        """
        # Aquí puedes integrar con reportlab, weasyprint, etc.
        # Por ahora retornamos un mensaje
        return f"PDF del comprobante {self.comprobante_completo}"
    
    @property
    def puede_reenviar(self):
        """Indica si el comprobante puede ser reenviado a SUNAT"""
        return self.comprEstadoSUNAT in ['PENDIENTE', 'RECHAZADO', 'OBSERVADO']
    
    @property
    def fue_aceptado(self):
        """Indica si el comprobante fue aceptado por SUNAT"""
        return self.comprEstadoSUNAT == 'ACEPTADO'

    @property
    def tiene_cdr(self):
        """Indica si el comprobante tiene CDR descargado"""
        return bool(self.comprNombreCDR)

    @property
    def url_descarga_cdr(self):
        """URL para descargar el CDR"""
        if self.tiene_cdr:
            return f'/api/sales/comprobantes/{self.comprCod}/descargar_cdr/'
        return None

    @property
    def url_descarga_xml(self):
        """URL para descargar el XML"""
        return f'/api/sales/comprobantes/{self.comprCod}/descargar_xml/'

    def get_estado_display_completo(self):
        """Estado completo con mensaje"""
        estado_base = self.get_comprEstadoSUNAT_display()
        if self.comprMensajeSUNAT:
            return f"{estado_base} - {self.comprMensajeSUNAT}"
        return estado_base
    @property
    def comprobante_completo(self):
        return f"{self.comprSerie}-{self.comprCorrelativo}"

    def save(self, *args, **kwargs):
        # Si es nuevo, determinar tipo y generar serie/correlativo automáticamente
        if not self.pk:
            self._determinar_tipo_comprobante()
            self._asignar_serie_correlativo()
            self._copiar_datos_venta()
        
        super().save(*args, **kwargs)
        
        # Generar detalles después de guardar
        if not hasattr(self, 'detalles') or not self.detalles.exists():
            self.generar_detalles_desde_venta()

    def _determinar_tipo_comprobante(self):
        """Determina el tipo de comprobante según el documento del cliente"""
        if self.ventCod.cliDocTipo == 'RUC':
            self.comprTipo = '01'  # Factura
        else:
            self.comprTipo = '03'  # Boleta

    def _asignar_serie_correlativo(self):
        """Asigna serie y correlativo automáticamente"""
        # Determinar serie según tipo
        if self.comprTipo == '01':  # Factura
            self.comprSerie = 'F001'
        else:  # Boleta
            self.comprSerie = 'B001'
        
        # Obtener siguiente correlativo
        ultimo = Comprobante.objects.filter(
            comprSerie=self.comprSerie
        ).order_by('-comprCorrelativo').first()
        
        self.comprCorrelativo = (ultimo.comprCorrelativo + 1) if ultimo else 1

    def _copiar_datos_venta(self):
        """Copia datos de la venta al comprobante"""
        venta = self.ventCod
        
        # Datos del cliente
        self.comprTipoDocReceptor = self._convertir_tipo_doc(venta.cliDocTipo)
        self.comprNumDocReceptor = venta.cliDocNum
        self.comprRazonSocialReceptor = venta.cliNombreCom
        self.comprDireccionReceptor = venta.cliDireccion
        
        # Totales
        self.comprTotalGravadas = venta.ventTotalGravada
        self.comprTotalExoneradas = venta.ventTotalExonerada
        self.comprTotalInafectas = venta.ventTotalInafecta
        self.comprTotalIGV = venta.ventIGV
        self.comprTotalVenta = venta.ventTotal

        # Datos del emisor (desde sucursal)
        if venta.sucurCod:
            self.comprRUCEmisor = getattr(venta.sucurCod, 'sucurRUC', '20123456789')
            self.comprRazonSocialEmisor = getattr(venta.sucurCod, 'sucurNom', 'EMPRESA SAC')
            self.comprDireccionEmisor = getattr(venta.sucurCod, 'sucurDireccion', 'AV. EJEMPLO 123')

    def _convertir_tipo_doc(self, tipo_doc_venta):
        conversion = {'DNI': '1', 'RUC': '6', 'CE': '-'}
        return conversion.get(tipo_doc_venta, '-')

    def generar_detalles_desde_venta(self):
        """Genera los detalles del comprobante desde la venta"""
        from .models import ComprobanteDetalle  # Import aquí para evitar circular
        
        venta_detalles = self.ventCod.ventadetalle_set.filter(ventDetAnulado=False)
        
        for detalle_venta in venta_detalles:
            ComprobanteDetalle.objects.create(
                comprCod=self,
                prodCod=detalle_venta.prodCod,
                comprDetDescripcion=detalle_venta.ventDetDescripcion,
                comprDetCantidad=detalle_venta.ventDetCantidad,
                comprDetValorUni=detalle_venta.ventDetValorUni,
                comprDetPrecioUni=detalle_venta.ventDetPrecioUni,
                comprDetSubtotal=detalle_venta.ventDetSubtotal,
                comprDetIGV=detalle_venta.ventDetIGV,
                comprDetTotal=detalle_venta.ventDetTotal,
                comprDetTipoIGV=detalle_venta.prodCod.prodTipoAfecIGV
            )

    @property
    def tiene_xml(self):
        """Indica si el comprobante tiene XML generado"""
        import os
        xml_path = f'xml_files/{self.comprSerie}-{self.comprCorrelativo}.xml'
        return os.path.exists(xml_path)

    @property
    def tiene_cdr(self):
        """Indica si el comprobante tiene CDR descargado"""
        import os
        cdr_path = f'cdr_files/R-{self.comprSerie}-{self.comprCorrelativo}.zip'
        return os.path.exists(cdr_path)


################################################################################### COMPROBANTE_DETALLE

class ComprobanteDetalle(models.Model):
    """
    Detalles del comprobante - copia de VentaDetalle
    """
    
    comprDetCod = models.AutoField(primary_key=True, verbose_name="Código Detalle Comprobante")
    
    # Relación con el comprobante
    comprCod = models.ForeignKey(
        Comprobante,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name="Comprobante"
    )
    
    # Producto (referencia al original)
    prodCod = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name="Producto"
    )

    # Descripción del producto al momento de la venta
    comprDetDescripcion = models.CharField(max_length=500, verbose_name="Descripción")
    comprDetMarca = models.CharField(max_length=100, verbose_name="Marca")
    
    # Cantidades y precios
    comprDetCantidad = models.IntegerField(verbose_name="Cantidad")
    comprDetValorUni = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Unitario")
    comprDetPrecioUni = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio Unitario")
    
    # Totales
    comprDetSubtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Subtotal")
    comprDetIGV = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="IGV")
    comprDetDescuento = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Descuento")
    comprDetTotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total")
    
    # Información tributaria
    comprDetTipoIGV = models.CharField(
        max_length=2,
        choices=[
            ('10', 'Gravado - Operación Onerosa'),
            ('20', 'Exonerado - Operación Onerosa'),
            ('30', 'Inafecto - Operación Onerosa'),
            ('40', 'Exportación'),
            ('31', 'Gratuita'),
        ],
        verbose_name="Tipo de Afectación IGV"
    )

    class Meta:
        db_table = 'comprobante_detalle'
        ordering = ['comprDetCod']
        verbose_name = 'Detalle de Comprobante'
        verbose_name_plural = 'Detalles de Comprobante'

    def __str__(self):
        return f"Det {self.comprDetCod} - {self.comprDetDescripcion[:50]}"

    @property
    def comprDetPrecioConIGV(self):
        """Retorna el precio unitario con IGV incluido"""
        return self.comprDetPrecioUni

    @property
    def comprDetValorSinIGV(self):
        """Retorna el valor unitario sin IGV"""
        return self.comprDetValorUni

