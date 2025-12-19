# Generated migration for sample data

from django.db import migrations


def load_sample_suppliers(apps, schema_editor):
    """Carga proveedores de prueba"""
    Supplier = apps.get_model('suppliers', 'Supplier')
    
    suppliers_data = [
        {
            'provRuc': '20123456789',
            'provRazSocial': 'Ray-Ban Perú S.A.C.',
            'provDirec': 'Av. Javier Prado Este 4200, San Borja',
            'provTele': '012345678',
            'provEmail': 'ventas@rayban.pe',
            'provCiu': 'Lima',
            'provEstado': 'Active'
        },
        {
            'provRuc': '20234567890',
            'provRazSocial': 'Oakley Distribution SAC',
            'provDirec': 'Calle Los Negocios 456, Surco',
            'provTele': '012345679',
            'provEmail': 'contacto@oakley.pe',
            'provCiu': 'Lima',
            'provEstado': 'Active'
        },
        {
            'provRuc': '20345678901',
            'provRazSocial': 'Lentes Zeiss Perú EIRL',
            'provDirec': 'Av. Arequipa 2850, Lince',
            'provTele': '012345680',
            'provEmail': 'info@zeiss.pe',
            'provCiu': 'Lima',
            'provEstado': 'Active'
        },
        {
            'provRuc': '20456789012',
            'provRazSocial': 'Óptica Global Import S.A.',
            'provDirec': 'Jr. de la Unión 789, Cercado',
            'provTele': '012345681',
            'provEmail': 'ventas@opticaglobal.com',
            'provCiu': 'Lima',
            'provEstado': 'Active'
        },
        {
            'provRuc': '20567890123',
            'provRazSocial': 'Visión Clara Distribuidores SAC',
            'provDirec': 'Av. La Marina 3456, San Miguel',
            'provTele': '012345682',
            'provEmail': 'pedidos@visionclara.pe',
            'provCiu': 'Lima',
            'provEstado': 'Active'
        },
        {
            'provRuc': '20678901234',
            'provRazSocial': 'Monturas Exclusivas S.R.L.',
            'provDirec': 'Calle Los Sauces 123, Miraflores',
            'provTele': '012345683',
            'provEmail': 'ventas@monturasexclusivas.com',
            'provCiu': 'Lima',
            'provEstado': 'Active'
        },
    ]
    
    for supplier_data in suppliers_data:
        Supplier.objects.get_or_create(
            provRuc=supplier_data['provRuc'],
            defaults=supplier_data
        )


def remove_sample_suppliers(apps, schema_editor):
    """Elimina los proveedores de prueba"""
    Supplier = apps.get_model('suppliers', 'Supplier')
    Supplier.objects.filter(provRuc__startswith='20').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('suppliers', '0002_rename_prov_ciu_supplier_provciu_and_more'),
    ]

    operations = [
        migrations.RunPython(load_sample_suppliers, remove_sample_suppliers),
    ]
