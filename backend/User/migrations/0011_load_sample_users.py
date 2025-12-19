# Generated migration for sample data

from django.db import migrations
from django.contrib.auth.hashers import make_password


def load_sample_users(apps, schema_editor):
    """Carga usuarios de prueba"""
    User = apps.get_model('User', 'User')
    Role = apps.get_model('User', 'Role')
    Branch = apps.get_model('Branch', 'Branch')
    
    # Obtener roles
    role_gerente = Role.objects.filter(rolNom='GERENTE').first()
    role_supervisor = Role.objects.filter(rolNom='SUPERVISOR').first()
    role_cajero = Role.objects.filter(rolNom='CAJERO').first()
    role_vendedor = Role.objects.filter(rolNom='VENDEDOR').first()
    role_optometra = Role.objects.filter(rolNom='OPTOMETRA').first()
    role_logistica = Role.objects.filter(rolNom='LOGISTICA').first()
    
    # Obtener sucursales
    sucursal_1 = Branch.objects.filter(sucurNom='Óptica Central Arequipa').first()
    sucursal_2 = Branch.objects.filter(sucurNom='Óptica Mall Aventura').first()
    sucursal_3 = Branch.objects.filter(sucurNom='Óptica Yanahuara').first()
    

    hashed_password = make_password('2025')
    
    users_data = [
        {
            'usuNom': 'supervisor1',
            'password': hashed_password,
            'usuNombreCom': 'María González Quispe',
            'usuDNI': '23456789',
            'usuTel': '987654322',
            'usuEmail': 'supervisor1@optica.com',
            'usuEstado': True,
            'is_staff': False,
            'is_active': True,
            'is_superuser': False,
            'sucurCod': sucursal_1,
            'roles': [role_supervisor] if role_supervisor else []
        },
        {
            'usuNom': 'cajero1',
            'password': hashed_password,
            'usuNombreCom': 'Juan Pérez Mamani',
            'usuDNI': '34567890',
            'usuTel': '987654323',
            'usuEmail': 'cajero1@optica.com',
            'usuEstado': True,
            'is_staff': False,
            'is_active': True,
            'is_superuser': False,
            'sucurCod': sucursal_1,
            'roles': [role_cajero] if role_cajero else []
        },
        {
            'usuNom': 'vendedor1',
            'password': hashed_password,
            'usuNombreCom': 'Ana Torres López',
            'usuDNI': '45678901',
            'usuTel': '987654324',
            'usuEmail': 'vendedor1@optica.com',
            'usuEstado': True,
            'is_staff': False,
            'is_active': True,
            'is_superuser': False,
            'sucurCod': sucursal_1,
            'roles': [role_vendedor] if role_vendedor else []
        },
        {
            'usuNom': 'optometra1',
            'password': hashed_password,
            'usuNombreCom': 'Dr. Roberto Chávez Silva',
            'usuDNI': '56789012',
            'usuTel': '987654325',
            'usuEmail': 'optometra1@optica.com',
            'usuEstado': True,
            'is_staff': False,
            'is_active': True,
            'is_superuser': False,
            'sucurCod': sucursal_2,
            'roles': [role_optometra] if role_optometra else []
        },
        {
            'usuNom': 'vendedor2',
            'password': hashed_password,
            'usuNombreCom': 'Lucía Ramos Condori',
            'usuDNI': '67890123',
            'usuTel': '987654326',
            'usuEmail': 'vendedor2@optica.com',
            'usuEstado': True,
            'is_staff': False,
            'is_active': True,
            'is_superuser': False,
            'sucurCod': sucursal_2,
            'roles': [role_vendedor] if role_vendedor else []
        },
        {
            'usuNom': 'cajero2',
            'password': hashed_password,
            'usuNombreCom': 'Pedro Vargas Huamán',
            'usuDNI': '78901234',
            'usuTel': '987654327',
            'usuEmail': 'cajero2@optica.com',
            'usuEstado': True,
            'is_staff': False,
            'is_active': True,
            'is_superuser': False,
            'sucurCod': sucursal_3,
            'roles': [role_cajero] if role_cajero else []
        },
        {
            'usuNom': 'logistica1',
            'password': hashed_password,
            'usuNombreCom': 'Carmen Díaz Apaza',
            'usuDNI': '89012345',
            'usuTel': '987654328',
            'usuEmail': 'logistica1@optica.com',
            'usuEstado': True,
            'is_staff': False,
            'is_active': True,
            'is_superuser': False,
            'sucurCod': sucursal_1,
            'roles': [role_logistica] if role_logistica else []
        },
    ]
    
    for user_data in users_data:
        roles = user_data.pop('roles', [])
        user, created = User.objects.get_or_create(
            usuNom=user_data['usuNom'],
            defaults=user_data
        )
        if created and roles:
            user.roles.set(roles)


def remove_sample_users(apps, schema_editor):
    """Elimina los usuarios de prueba"""
    User = apps.get_model('User', 'User')
    User.objects.filter(usuEmail__contains='@optica.com').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('User', '0010_alter_role_rolnivel'),
        ('Branch', '0005_load_sample_branches'),
    ]

    operations = [
        migrations.RunPython(load_sample_users, remove_sample_users),
    ]
