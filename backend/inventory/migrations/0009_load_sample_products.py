# Generated migration for sample data

from django.db import migrations
from decimal import Decimal


def load_sample_products(apps, schema_editor):
    """Carga categorías y productos de prueba"""
    ProductCategory = apps.get_model('inventory', 'ProductCategory')
    Product = apps.get_model('inventory', 'Product')
    Supplier = apps.get_model('suppliers', 'Supplier')
    Branch = apps.get_model('Branch', 'Branch')
    BranchInventory = apps.get_model('inventory', 'BranchInventory')
    
    # Crear categorías
    categories_data = [
        'Monturas Metálicas',
        'Monturas Acetato',
        'Lentes De Sol',
        'Lentes Deportivos',
        'Lentes Oftálmicos',
        'Lentes De Contacto',
        'Lentes Progresivos',
        'Accesorios',
        'Estuches',
        'Soluciones De Limpieza',
    ]
    
    for cat_name in categories_data:
        ProductCategory.objects.get_or_create(catproNom=cat_name)
    
    # Obtener referencias
    cat_metalicas = ProductCategory.objects.filter(catproNom='Monturas Metálicas').first()
    cat_acetato = ProductCategory.objects.filter(catproNom='Monturas Acetato').first()
    cat_sol = ProductCategory.objects.filter(catproNom='Lentes De Sol').first()
    cat_deportivos = ProductCategory.objects.filter(catproNom='Lentes Deportivos').first()
    cat_oftalmicos = ProductCategory.objects.filter(catproNom='Lentes Oftálmicos').first()
    cat_contacto = ProductCategory.objects.filter(catproNom='Lentes De Contacto').first()
    cat_progresivos = ProductCategory.objects.filter(catproNom='Lentes Progresivos').first()
    cat_estuches = ProductCategory.objects.filter(catproNom='Estuches').first()
    cat_limpieza = ProductCategory.objects.filter(catproNom='Soluciones De Limpieza').first()
    
    prov_rayban = Supplier.objects.filter(provRuc='20123456789').first()
    prov_oakley = Supplier.objects.filter(provRuc='20234567890').first()
    prov_zeiss = Supplier.objects.filter(provRuc='20345678901').first()
    prov_global = Supplier.objects.filter(provRuc='20456789012').first()
    prov_vision = Supplier.objects.filter(provRuc='20567890123').first()
    prov_monturas = Supplier.objects.filter(provRuc='20678901234').first()
    
    branch_1 = Branch.objects.filter(sucurNom='Óptica Central Arequipa').first()
    branch_2 = Branch.objects.filter(sucurNom='Óptica Mall Aventura').first()
    branch_3 = Branch.objects.filter(sucurNom='Óptica Yanahuara').first()
    
    # Productos GLOBALES
    products_global = [
        {
            'prodDescr': 'Montura Ray-Ban Aviador Clásico Negro',
            'prodMarca': 'Ray-Ban',
            'prodMate': 'Metal',
            'prodPublico': 'ADULTO',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('250.00'),
            'prodValorUni': Decimal('450.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_metalicas,
            'provCod': prov_rayban,
            'branchOwner': None
        },
        {
            'prodDescr': 'Montura Ray-Ban Wayfarer Acetato Marrón',
            'prodMarca': 'Ray-Ban',
            'prodMate': 'Acetato',
            'prodPublico': 'JOVEN',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('200.00'),
            'prodValorUni': Decimal('380.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_acetato,
            'provCod': prov_rayban,
            'branchOwner': None
        },
        {
            'prodDescr': 'Lentes de Sol Oakley Deportivos Polarizados',
            'prodMarca': 'Oakley',
            'prodMate': 'Policarbonato',
            'prodPublico': 'ADULTO',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('300.00'),
            'prodValorUni': Decimal('550.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_deportivos,
            'provCod': prov_oakley,
            'branchOwner': None
        },
        {
            'prodDescr': 'Lentes Oftálmicos Zeiss Antireflex',
            'prodMarca': 'Zeiss',
            'prodMate': 'Cristal',
            'prodPublico': 'ADULTO',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('180.00'),
            'prodValorUni': Decimal('320.00'),
            'prodUnidadMedi': 'PAR',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_oftalmicos,
            'provCod': prov_zeiss,
            'branchOwner': None
        },
        {
            'prodDescr': 'Lentes Progresivos Varilux Premium',
            'prodMarca': 'Varilux',
            'prodMate': 'Cristal',
            'prodPublico': 'ADULTO',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('400.00'),
            'prodValorUni': Decimal('750.00'),
            'prodUnidadMedi': 'PAR',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_progresivos,
            'provCod': prov_global,
            'branchOwner': None
        },
        {
            'prodDescr': 'Montura Tommy Hilfiger Acetato Azul',
            'prodMarca': 'Tommy Hilfiger',
            'prodMate': 'Acetato',
            'prodPublico': 'JOVEN',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('150.00'),
            'prodValorUni': Decimal('280.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_acetato,
            'provCod': prov_vision,
            'branchOwner': None
        },
        {
            'prodDescr': 'Lentes de Contacto Biofinity Mensuales',
            'prodMarca': 'Biofinity',
            'prodMate': 'Hidrogel de Silicona',
            'prodPublico': 'TODOS',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('80.00'),
            'prodValorUni': Decimal('150.00'),
            'prodUnidadMedi': 'SET',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_contacto,
            'provCod': prov_vision,
            'branchOwner': None
        },
        {
            'prodDescr': 'Estuche Rígido Premium',
            'prodMarca': 'Genérico',
            'prodMate': 'Plástico',
            'prodPublico': 'TODOS',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('8.00'),
            'prodValorUni': Decimal('18.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_estuches,
            'provCod': prov_monturas,
            'branchOwner': None
        },
        {
            'prodDescr': 'Solución de Limpieza Renu 360ml',
            'prodMarca': 'Renu',
            'prodMate': 'Líquido',
            'prodPublico': 'TODOS',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('12.00'),
            'prodValorUni': Decimal('25.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_limpieza,
            'provCod': prov_vision,
            'branchOwner': None
        },
        {
            'prodDescr': 'Montura Oakley Holbrook Negra',
            'prodMarca': 'Oakley',
            'prodMate': 'Acetato',
            'prodPublico': 'ADULTO',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('220.00'),
            'prodValorUni': Decimal('420.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'GLOBAL',
            'prodEstado': 'Active',
            'catproCod': cat_acetato,
            'provCod': prov_oakley,
            'branchOwner': None
        },
    ]
    
    # Productos LOCALES
    products_local = [
        {
            'prodDescr': 'Montura Local Arequipa Modelo Clásico',
            'prodMarca': 'Arequipa Vision',
            'prodMate': 'Metal',
            'prodPublico': 'ADULTO',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('100.00'),
            'prodValorUni': Decimal('200.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'LOCAL',
            'prodEstado': 'Active',
            'catproCod': cat_metalicas,
            'provCod': prov_global,
            'branchOwner': branch_1
        },
        {
            'prodDescr': 'Lentes de Sol Local Económico',
            'prodMarca': 'Vision Express',
            'prodMate': 'Plástico',
            'prodPublico': 'JOVEN',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('50.00'),
            'prodValorUni': Decimal('120.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'LOCAL',
            'prodEstado': 'Active',
            'catproCod': cat_sol,
            'provCod': prov_global,
            'branchOwner': branch_1
        },
        {
            'prodDescr': 'Montura Deportiva Local Mall Aventura',
            'prodMarca': 'Sport Vision',
            'prodMate': 'Policarbonato',
            'prodPublico': 'JOVEN',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('80.00'),
            'prodValorUni': Decimal('160.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'LOCAL',
            'prodEstado': 'Active',
            'catproCod': cat_deportivos,
            'provCod': prov_vision,
            'branchOwner': branch_2
        },
        {
            'prodDescr': 'Lentes Lectura +2.00 Yanahuara',
            'prodMarca': 'Reading Plus',
            'prodMate': 'Plástico',
            'prodPublico': 'ADULTO',
            'prodTipoAfecIGV': '10',
            'prodCostoInv': Decimal('30.00'),
            'prodValorUni': Decimal('60.00'),
            'prodUnidadMedi': 'NIU',
            'prodOrigin': 'LOCAL',
            'prodEstado': 'Active',
            'catproCod': cat_oftalmicos,
            'provCod': prov_monturas,
            'branchOwner': branch_3
        },
    ]
    
    # Crear productos
    created_products = []
    for prod_data in products_global + products_local:
        product, created = Product.objects.get_or_create(
            prodDescr=prod_data['prodDescr'],
            catproCod=prod_data['catproCod'],
            provCod=prod_data['provCod'],
            defaults=prod_data
        )
        created_products.append(product)
    
    # Crear inventario para sucursales
    if branch_1 and len(created_products) >= 12:
        inventories_branch_1 = [
            (created_products[0], 25, 5),
            (created_products[1], 30, 5),
            (created_products[2], 15, 3),
            (created_products[3], 40, 8),
            (created_products[4], 10, 2),
            (created_products[5], 20, 5),
            (created_products[6], 50, 10),
            (created_products[7], 100, 20),
            (created_products[8], 80, 15),
            (created_products[9], 12, 3),
            (created_products[10], 18, 5),
            (created_products[11], 22, 5),
        ]
        
        for product, stock, min_stock in inventories_branch_1:
            BranchInventory.objects.get_or_create(
                sucurCod=branch_1,
                prodCod=product,
                defaults={'invStock': stock, 'invStockMin': min_stock}
            )
    
    if branch_2 and len(created_products) >= 13:
        inventories_branch_2 = [
            (created_products[0], 18, 5),
            (created_products[1], 25, 5),
            (created_products[2], 12, 3),
            (created_products[3], 35, 8),
            (created_products[4], 8, 2),
            (created_products[5], 15, 5),
            (created_products[6], 45, 10),
            (created_products[7], 90, 20),
            (created_products[8], 70, 15),
            (created_products[9], 10, 3),
            (created_products[12], 15, 5),
        ]
        
        for product, stock, min_stock in inventories_branch_2:
            BranchInventory.objects.get_or_create(
                sucurCod=branch_2,
                prodCod=product,
                defaults={'invStock': stock, 'invStockMin': min_stock}
            )
    
    if branch_3 and len(created_products) >= 14:
        inventories_branch_3 = [
            (created_products[0], 20, 5),
            (created_products[1], 28, 5),
            (created_products[2], 14, 3),
            (created_products[3], 38, 8),
            (created_products[4], 9, 2),
            (created_products[5], 18, 5),
            (created_products[6], 48, 10),
            (created_products[7], 95, 20),
            (created_products[8], 75, 15),
            (created_products[13], 25, 5),
        ]
        
        for product, stock, min_stock in inventories_branch_3:
            BranchInventory.objects.get_or_create(
                sucurCod=branch_3,
                prodCod=product,
                defaults={'invStock': stock, 'invStockMin': min_stock}
            )


def remove_sample_products(apps, schema_editor):
    """Elimina productos y categorías de prueba"""
    Product = apps.get_model('inventory', 'Product')
    ProductCategory = apps.get_model('inventory', 'ProductCategory')
    BranchInventory = apps.get_model('inventory', 'BranchInventory')
    
    BranchInventory.objects.all().delete()
    Product.objects.all().delete()
    ProductCategory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0008_product_created_at'),
        ('suppliers', '0003_load_sample_suppliers'),
        ('Branch', '0005_load_sample_branches'),
    ]

    operations = [
        migrations.RunPython(load_sample_products, remove_sample_products),
    ]
