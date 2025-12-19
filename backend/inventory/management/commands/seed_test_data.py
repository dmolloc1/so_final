from django.core.management.base import BaseCommand
from inventory.models import ProductCategory, Product, BranchInventory
from suppliers.models import Supplier
from Branch.models import Branch
from decimal import Decimal

class Command(BaseCommand):
    help = 'Crea datos de prueba para el sistema de productos'

    def handle(self, *args, **kwargs):
        self.stdout.write('🌱 Creando datos de prueba...\n')

        # 1. Crear categorías
        self.stdout.write('📦 Creando categorías...')
        categorias = {
            'monturas': ProductCategory.objects.get_or_create(catproNom='Monturas')[0],
            'lentes': ProductCategory.objects.get_or_create(catproNom='Lentes')[0],
            'accesorios': ProductCategory.objects.get_or_create(catproNom='Accesorios')[0],
        }
        self.stdout.write(self.style.SUCCESS(f'✅ {len(categorias)} categorías creadas'))

        # 2. Crear proveedor
        self.stdout.write('🏭 Creando proveedor...')
        proveedor, created = Supplier.objects.get_or_create(
            provRuc="12345678901",
            defaults={
                "provRazSocial": "Proveedor de Prueba",
                "provDirec": "Calle Falsa 123",
                "provTele": "987654321",
                "provEmail": "proveedor@test.com",
                "provCiu": "Arequipa",
                "provEstado": "Active",
            }
        )

        self.stdout.write(self.style.SUCCESS(f'✅ Proveedor creado: {proveedor.provRazSocial}'))


        # 3. Crear sucursales
        self.stdout.write('🏢 Creando sucursales...')
        sucursales = {}
        for nombre in ['Miraflores', 'San Isidro', 'Surco']:
            sucursal, created = Branch.objects.get_or_create(
                sucurNom="Sucursal Central",
                defaults={
                    "sucurDep": "AREQUIPA",
                    "sucurCiu": "Arequipa",
                    "sucurDis": "Cercado",
                    "sucurDir": "Av. Ejemplo 123",
                    "sucurTel": "999888777",
                    "sucurEstado": "Active",
                }
            )

            sucursales[nombre.lower()] = sucursal
        self.stdout.write(self.style.SUCCESS(f'✅ {len(sucursales)} sucursales creadas'))

        # 4. Crear productos GLOBALES
        self.stdout.write('🌍 Creando productos GLOBALES...')
        productos_globales = [
            {
                'prodDescr': 'Montura RayBan Aviator Classic',
                'prodMarca': 'RayBan',
                'prodMate': 'Metal',
                'prodPublico': 'ADULTO',
                'prodCostoInv': Decimal('150.00'),
                'prodValorUni': Decimal('300.00'),
                'catproCod': categorias['monturas'],
            },
            {
                'prodDescr': 'Montura Oakley Holbrook',
                'prodMarca': 'Oakley',
                'prodMate': 'Acetato',
                'prodPublico': 'JOVEN',
                'prodCostoInv': Decimal('180.00'),
                'prodValorUni': Decimal('350.00'),
                'catproCod': categorias['monturas'],
            },
            {
                'prodDescr': 'Lente Transitions Gen 8',
                'prodMarca': 'Transitions',
                'prodMate': 'Policarbonato',
                'prodPublico': 'TODOS',
                'prodCostoInv': Decimal('100.00'),
                'prodValorUni': Decimal('200.00'),
                'catproCod': categorias['lentes'],
            },
            {
                'prodDescr': 'Estuche rígido premium',
                'prodMarca': 'Genérico',
                'prodMate': 'Plástico',
                'prodPublico': 'TODOS',
                'prodCostoInv': Decimal('5.00'),
                'prodValorUni': Decimal('15.00'),
                'catproCod': categorias['accesorios'],
            },
        ]

        for data in productos_globales:
            producto, created = Product.objects.get_or_create(
                prodDescr=data['prodDescr'],
                defaults={
                    **data,
                    'provCod': proveedor,
                    'prodOrigin': 'GLOBAL',
                    'branchOwner': None,
                    'prodEstado': 'Active',
                }
            )
            
            # Crear inventario en cada sucursal
            if created:
                for nombre, sucursal in sucursales.items():
                    stock = 10 if nombre == 'miraflores' else 5
                    BranchInventory.objects.get_or_create(
                        sucurCod=sucursal,
                        prodCod=producto,
                        defaults={
                            'invStock': stock,
                            'invStockMin': 3
                        }
                    )
        
        self.stdout.write(self.style.SUCCESS(f'✅ {len(productos_globales)} productos globales creados'))

        # 5. Crear productos LOCALES
        self.stdout.write('📍 Creando productos LOCALES...')
        
        # Producto local para Miraflores
        producto_local_mf, created = Product.objects.get_or_create(
            prodDescr='Montura Artesanal Cuero Premium - Miraflores',
            defaults={
                'prodMarca': 'Artesanal',
                'prodMate': 'Cuero',
                'prodPublico': 'ADULTO',
                'prodCostoInv': Decimal('50.00'),
                'prodValorUni': Decimal('120.00'),
                'catproCod': categorias['monturas'],
                'provCod': proveedor,
                'prodOrigin': 'LOCAL',
                'branchOwner': sucursales['miraflores'],
                'prodEstado': 'Active',
            }
        )
        
        if created:
            BranchInventory.objects.get_or_create(
                sucurCod=sucursales['miraflores'],
                prodCod=producto_local_mf,
                defaults={
                    'invStock': 3,
                    'invStockMin': 1
                }
            )
        
        # Producto local para San Isidro
        producto_local_si, created = Product.objects.get_or_create(
            prodDescr='Servicio Ajuste Premium - San Isidro',
            defaults={
                'prodMarca': 'Servicio',
                'prodMate': 'N/A',
                'prodPublico': 'TODOS',
                'prodCostoInv': Decimal('0.00'),
                'prodValorUni': Decimal('30.00'),
                'catproCod': categorias['accesorios'],
                'provCod': proveedor,
                'prodOrigin': 'LOCAL',
                'branchOwner': sucursales['san isidro'],
                'prodEstado': 'Active',
                'prodUnidadMedi': 'ZZ',  # Servicios
            }
        )
        
        if created:
            BranchInventory.objects.get_or_create(
                sucurCod=sucursales['san isidro'],
                prodCod=producto_local_si,
                defaults={
                    'invStock': 100,  # "Stock" ilimitado para servicios
                    'invStockMin': 50
                }
            )
        
        self.stdout.write(self.style.SUCCESS('✅ 2 productos locales creados'))

        # Resumen
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE'))
        self.stdout.write('='*50)
        self.stdout.write(f'📦 Categorías: {ProductCategory.objects.count()}')
        self.stdout.write(f'🏭 Proveedores: {Supplier.objects.count()}')
        self.stdout.write(f'🏢 Sucursales: {Branch.objects.count()}')
        self.stdout.write(f'📦 Productos totales: {Product.objects.count()}')
        self.stdout.write(f'🌍 Productos globales: {Product.objects.filter(prodOrigin="GLOBAL").count()}')
        self.stdout.write(f'📍 Productos locales: {Product.objects.filter(prodOrigin="LOCAL").count()}')
        self.stdout.write(f'📊 Inventarios: {BranchInventory.objects.count()}')
        self.stdout.write('='*50 + '\n')