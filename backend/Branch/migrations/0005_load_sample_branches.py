# Generated migration for sample data

from django.db import migrations


def load_sample_branches(apps, schema_editor):
    """Carga sucursales de prueba"""
    Branch = apps.get_model('Branch', 'Branch')
    
    branches = [
        {
            'sucurNom': 'Óptica Central Arequipa',
            'sucurDep': 'AREQUIPA',
            'sucurCiu': 'Arequipa',
            'sucurDis': 'Cercado',
            'sucurDir': 'Av. La Marina 123',
            'sucurTel': '054234567',
            'sucurEstado': 'Active'
        },
        {
            'sucurNom': 'Óptica Mall Aventura',
            'sucurDep': 'AREQUIPA',
            'sucurCiu': 'Arequipa',
            'sucurDis': 'Cayma',
            'sucurDir': 'Mall Aventura Plaza, Local 205',
            'sucurTel': '054567890',
            'sucurEstado': 'Active'
        },
        {
            'sucurNom': 'Óptica Yanahuara',
            'sucurDep': 'AREQUIPA',
            'sucurCiu': 'Arequipa',
            'sucurDis': 'Yanahuara',
            'sucurDir': 'Av. Ejército 456',
            'sucurTel': '054345678',
            'sucurEstado': 'Active'
        },
        {
            'sucurNom': 'Óptica Lima Centro',
            'sucurDep': 'LIMA',
            'sucurCiu': 'Lima',
            'sucurDis': 'Miraflores',
            'sucurDir': 'Av. Larco 789',
            'sucurTel': '012345678',
            'sucurEstado': 'Active'
        },
        {
            'sucurNom': 'Óptica Cusco Plaza',
            'sucurDep': 'CUSCO',
            'sucurCiu': 'Cusco',
            'sucurDis': 'Wanchaq',
            'sucurDir': 'Av. de la Cultura 321',
            'sucurTel': '084123456',
            'sucurEstado': 'Active'
        },
    ]
    
    for branch_data in branches:
        Branch.objects.get_or_create(
            sucurNom=branch_data['sucurNom'],
            defaults=branch_data
        )


def remove_sample_branches(apps, schema_editor):
    """Elimina las sucursales de prueba"""
    Branch = apps.get_model('Branch', 'Branch')
    Branch.objects.filter(sucurNom__contains='Óptica').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('Branch', '0004_alter_branch_sucurestado'),
    ]

    operations = [
        migrations.RunPython(load_sample_branches, remove_sample_branches),
    ]
