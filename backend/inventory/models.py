from django.db import models
from django.core.exceptions import ValidationError

# Categoria_Producto

class ProductCategory(models.Model):
    catproCod = models.AutoField(primary_key=True) # Codigo de categoria producto
    catproNom = models.CharField(max_length=100, unique=True) # Nombre de categoria producto

    def clean (self):
        super().clean()
        if len(self.catproNom.strip()) < 2:
            raise ValidationError({
                 'catproNom': 'El nombre debe tener al menos 2 caracteres.'
            })

    def save(self, *args, **kwargs):
        self.catproNom = self.catproNom.strip().title()
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.catproNom

    class Meta:
        db_table = 'product_category'
        verbose_name = 'Categoría de Producto'
        verbose_name_plural = 'Categorías de Productos'
        ordering = ['catproNom']



# Producto ----- Importantisimo

from decimal import Decimal

from suppliers.models import Supplier
from Branch.models import Branch

class Product(models.Model):
    
    STATUS_CHOICES = [
        ('Active', 'Activo'),
        ('Inactive', 'Inactivo'),
    ]
    
    # Códigos de Tipo de Afectación IGV según SUNAT
    IGV_CHOICES = [
        ('10', 'Gravado - Operación Onerosa'),
        ('20', 'Exonerado - Operación Onerosa'),
        ('30', 'Inafecto - Operación Onerosa'),
        ('40', 'Exportación'),
    ]
    
    # Códigos de Unidad de Medida según SUNAT (Catálogo 03)
    UNIDAD_MEDIDA_CHOICES = [
        ('NIU', 'NIU - Unidad (bienes)'),
        ('ZZ', 'ZZ - Unidad (servicios)'),
        ('BX', 'BX - Caja'),
        ('PK', 'PK - Paquete'),
        ('SET', 'SET - Juego'),
        ('PR', 'PR - Par'),
        ('DZN', 'DZN - Docena'),
    ]

    PROD_ORIGIN_CHOICES = [
        ('GLOBAL', 'Global'),
        ('LOCAL', 'Local'),
    ]
    
    # Público objetivo (tipo de cliente)
    PUBLICO_CHOICES = [
        ('ADULTO', 'Adulto'),
        ('JOVEN', 'Joven'),
        ('NIÑO', 'Niño'),
        ('BEBE', 'Bebé'),
        ('UNISEX', 'Unisex'),
        ('TODOS', 'Todos'),
    ]

    # Primary key
    prodCod = models.AutoField(primary_key=True) #primary key
    
    #Nuevos campos para manejar lo del codigo de barras
    
    """
    prodSKU = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="SKU",
        help_text="Código interno descriptivo (ej: MON-RAY-AVI-BLK-M)",
        blank=True,  # Se genera automáticamente
        null=True
    )
    """
    
    

    prodBarcode = models.CharField(
        max_length=13,
        unique=True,
        verbose_name="Código de Barras",
        help_text="Código de barras EAN-13 (13 dígitos)",
        blank=True,  # Se genera automáticamente
        null=True
    )

    # Foreign Keys

    branchOwner = models.ForeignKey(
        Branch,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Sucursal Propietaria",
        help_text="Solo para productos locales. Para productos globales debe ser NULL."
    )

    catproCod = models.ForeignKey(
        ProductCategory,
        on_delete = models.PROTECT,
        verbose_name = "Categoria"
    )

    provCod = models.ForeignKey(
        Supplier,
        on_delete = models.PROTECT,
        verbose_name = "Proveedor"
    )


    # Otros campos
    prodDescr = models.TextField(
        verbose_name="Descripción",
        help_text="Descripción que aparecerá en la boleta/factura"
    )
    
    prodMarca = models.CharField(
        max_length=100,
        verbose_name="Marca"
    )
    
    prodMate = models.CharField(
        max_length=100,
        verbose_name="Material",
        blank=True
    )

    prodPublico = models.CharField(
        max_length=20,
        choices=PUBLICO_CHOICES,
        default='TODOS',
        verbose_name="Público Objetivo",
        help_text="¿A qué público está dirigido? (Adulto, Joven, Niño, etc.)"
    )

    prodTipoAfecIGV = models.CharField(
        max_length=2,
        choices=IGV_CHOICES,
        default='10',
        verbose_name="Tipo Afectación IGV",
        help_text="Código SUNAT: 10=Gravado, 20=Exonerado, 30=Inafecto"
    )

    prodCostoInv = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Costo de Inventario",
        help_text="Precio de compra del producto"
    )
    
    prodValorUni = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor Unitario",
        help_text="Precio de venta SIN IGV (Base imponible)"
    )

    prodUnidadMedi = models.CharField(
        max_length=10,
        choices=UNIDAD_MEDIDA_CHOICES,
        default='NIU',
        verbose_name="Unidad de Medida",
        help_text="Código SUNAT (Catálogo 03) - Aparece en boleta/factura"
    )

    prodOrigin = models.CharField(
        max_length=10,
        choices=PROD_ORIGIN_CHOICES,
        default='GLOBAL',
        verbose_name="Origen del Producto",
        help_text="Global = creado por Gerente | Local = creado por Supervisor"
    )

    prodEstado = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='Active',
        verbose_name="Estado"
    )

    ##Le aumento para los webhocks
    created_at = models.DateTimeField(auto_now_add=True)
    ##


    def __str__(self):
        if self.prodBarcode:
            return f"{self.prodCod} - [{self.prodBarcode}] {self.prodMarca} - {self.prodDescr[:50]}"
        return f"{self.prodCod} - {self.prodMarca} - {self.prodDescr[:50]}"
    
 
    class Meta:
        db_table = 'product'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['prodMarca', 'prodDescr']
        constraints = [
            models.UniqueConstraint(
                fields=['catproCod', 'provCod', 'prodDescr'],
                name='unique_product_per_category_supplier'
            )
        ]


    # Validaciones
    def clean(self):
        super().clean()
        
        # Validación: productos locales deben tener sucursal propietaria
        if self.prodOrigin == 'LOCAL' and self.branchOwner is None:
            raise ValidationError({
                'branchOwner': 'Los productos locales deben pertenecer a una sucursal.'
            })

        # Los productos globales NO deben tener sucursal propietaria
        if self.prodOrigin == 'GLOBAL' and self.branchOwner is not None:
            raise ValidationError({
                'branchOwner': 'Los productos globales no deben tener sucursal propietaria.'
            })


        # Validar descripción
        if len(self.prodDescr.strip()) < 5:
            raise ValidationError({
                'prodDescr': 'La descripción debe tener al menos 5 caracteres.'
            })
        
        # Validar marca
        if len(self.prodMarca.strip()) < 2:
            raise ValidationError({
                'prodMarca': 'La marca debe tener al menos 2 caracteres.'
            })
        
        # Validar precios positivos
        if self.prodCostoInv < 0:
            raise ValidationError({
                'prodCostoInv': 'El costo no puede ser negativo.'
            })
        
        if self.prodValorUni < 0:
            raise ValidationError({
                'prodValorUni': 'El valor unitario no puede ser negativo.'
            })
        
        # Validar que precio de venta >= costo
        if self.prodValorUni < self.prodCostoInv:
            raise ValidationError({
                'prodValorUni': 'El precio de venta debe ser mayor o igual al costo.'
            })
        
        
        # Validar codigo de barras
        if self.prodBarcode:
            if len(self.prodBarcode) != 13:
                raise ValidationError({
                    'prodBarcode': 'El código de barras debe tener 13 dígitos.'
                })
            if not self.prodBarcode.isdigit():
                raise ValidationError({
                    'prodBarcode': 'El código de barras solo debe contener números.'
                })


    def generate_barcode(self):
        
        ##Genera el código de barras basado en el ID del producto
        #Se llama automáticamente después de crear el producto
        
        if not self.prodBarcode and self.prodCod:
            # 775 (Perú) + 1234 (tu empresa) + ID producto (5 dígitos) + checksum
            country = '775'
            company = '1234'  # Cambia esto por tu código de empresa
            product_id = str(self.prodCod).zfill(5)  # Pad con ceros: 00123
            
            # Primeros 12 dígitos
            code12 = country + company + product_id
            
            # Calcular checksum
            total = 0
            for i, digit in enumerate(code12):
                num = int(digit)
                total += num if i % 2 == 0 else num * 3
            checksum = (10 - (total % 10)) % 10
            
            # Código completo
            self.prodBarcode = code12 + str(checksum)
            self.save(update_fields=['prodBarcode'])        



    def save(self, *args, **kwargs):
        # Guardamos primero para tener el ID
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Generamos codiog de barras si es nuevo y no tiene
        if is_new and not self.prodBarcode:
            self.generate_barcode()

    @property
    def is_active(self):
        """Verifica si está activo"""
        return self.prodEstado == 'Active'
    
    @property
    def precioVentaConIGV(self):
        """Precio de venta CON IGV"""
        if self.prodTipoAfecIGV == '10':  # Gravado
            return round(self.prodValorUni * Decimal('1.18'), 2)
        return self.prodValorUni
    
    @property
    def montoIGV(self):
        """Calcula solo el IGV"""
        if self.prodTipoAfecIGV == '10':
            return round(self.prodValorUni * Decimal('0.18'), 2)
        return Decimal('0.00')
    
    @property
    def margenGanancia(self):
        """Margen de ganancia en %"""
        if self.prodCostoInv > 0:
            margen = ((self.prodValorUni - self.prodCostoInv) / self.prodCostoInv) * 100
            return round(margen, 2)
        return 0
    

# Inventario Sucursal

class BranchInventory (models.Model):
    
    sucurCod = models.ForeignKey(
        Branch,
        on_delete = models.PROTECT,
        verbose_name = "Sucursal"
    )

    prodCod = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name="Producto"
    )

    invStock = models.IntegerField(
        default=0,
        verbose_name="Stock en Sucursal",
        help_text="Cantidad disponible en esta sucursal"
    )

    invStockMin = models.IntegerField(
        default=5,
        verbose_name="Stock Mínimo",
        help_text="Cantidad mínima antes de generar alerta"
    )

    class Meta:
        db_table = 'branch_inventory'
        verbose_name = 'Inventario de Sucursal'
        verbose_name_plural = 'Inventarios de Sucursales'
        ordering = ['sucurCod', 'prodCod']
        constraints = [
            models.UniqueConstraint(
                fields=['sucurCod', 'prodCod'],
                name='unique_inventory_per_branch_product'
            )
        ]
    
    def __str__(self):
        return f"{self.sucurCod.sucurNom} - {self.prodCod.prodMarca} ({self.invStock})"

    def clean(self):
        super().clean()
        
        product = self.prodCod

        # Si es producto LOCAL, solo puede existir en branchOwner
        if product.prodOrigin == 'LOCAL' and self.sucurCod != product.branchOwner:
            raise ValidationError({
                'prodCod': f"El producto local solo puede existir en su sucursal: {product.branchOwner}"
            })
        
        if self.invStock < 0:
            raise ValidationError({
                'invStock': 'El stock no puede ser negativo.'
            })
        
        if self.invStockMin < 0:
            raise ValidationError({
                'invStockMin': 'El stock mínimo no puede ser negativo.'
            })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def valorTotalStock(self):
        """Valor total del stock en esta sucursal"""
        return round(self.invStock * self.prodCod.prodCostoInv, 2)
    
    @property
    def is_low_stock(self):
        """Verifica si está por debajo del stock mínimo"""
        return self.invStock <= self.invStockMin
    
    @property
    def necesitaReposicion(self):
        """Calcula cuántas unidades faltan para el stock mínimo"""
        if self.invStock < self.invStockMin:
            return self.invStockMin - self.invStock
        return 0