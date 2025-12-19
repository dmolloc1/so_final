# Generated migration for sample data

from django.db import migrations
from django.utils import timezone
from datetime import timedelta


def load_sample_cash_data(apps, schema_editor):
    """Carga cajas y aperturas de prueba"""
    Cash = apps.get_model('cash', 'Cash')
    CashOpening = apps.get_model('cash', 'CashOpening')
    Branch = apps.get_model('Branch', 'Branch')
    User = apps.get_model('User', 'User')
    
    # Obtener referencias
    branch_1 = Branch.objects.filter(sucurNom='Óptica Central Arequipa').first()
    branch_2 = Branch.objects.filter(sucurNom='Óptica Mall Aventura').first()
    branch_3 = Branch.objects.filter(sucurNom='Óptica Yanahuara').first()
    
    cajero1 = User.objects.filter(usuNom='cajero1').first()
    cajero2 = User.objects.filter(usuNom='cajero2').first()
    optometra1 = User.objects.filter(usuNom='optometra1').first()
    
    # Crear cajas
    if branch_1 and cajero1:
        caja1, _ = Cash.objects.get_or_create(
            cajNom='Caja Principal Arequipa',
            defaults={
                'cajDes': 'Caja principal de la sucursal central',
                'cajEstado': 'ACTIVO',
                'sucurCod': branch_1,
                'usuCod': cajero1
            }
        )
        
        caja2, _ = Cash.objects.get_or_create(
            cajNom='Caja Secundaria Arequipa',
            defaults={
                'cajDes': 'Caja secundaria para alta demanda',
                'cajEstado': 'ACTIVO',
                'sucurCod': branch_1,
                'usuCod': cajero1
            }
        )
        
        # Apertura cerrada (día anterior)
        CashOpening.objects.get_or_create(
            cajCod=caja1,
            cajaApertuFechHora=timezone.now() - timedelta(days=1, hours=-8),
            defaults={
                'usuCod': cajero1,
                'cajaAperMontInicial': 500.00,
                'cajaAperFechaHorCierre': timezone.now() - timedelta(days=1, hours=12),
                'cajaAperMontCierre': 2850.50,
                'cajaAperMontEsperado': 2850.00,
                'cajaAperDiferencia': 0.50,
                'cajaAperEstado': 'CERRADA',
                'cajaAperObservacio': 'Día normal de ventas'
            }
        )
        
        # Apertura abierta (día actual)
        CashOpening.objects.get_or_create(
            cajCod=caja1,
            cajaApertuFechHora=timezone.now().replace(hour=8, minute=0, second=0),
            defaults={
                'usuCod': cajero1,
                'cajaAperMontInicial': 500.00,
                'cajaAperEstado': 'ABIERTA',
                'cajaAperObservacio': 'Caja del día actual'
            }
        )
        
        # Apertura secundaria abierta
        CashOpening.objects.get_or_create(
            cajCod=caja2,
            cajaApertuFechHora=timezone.now().replace(hour=9, minute=0, second=0),
            defaults={
                'usuCod': cajero1,
                'cajaAperMontInicial': 300.00,
                'cajaAperEstado': 'ABIERTA',
                'cajaAperObservacio': 'Caja secundaria activa'
            }
        )
    
    if branch_2 and optometra1:
        caja3, _ = Cash.objects.get_or_create(
            cajNom='Caja Mall Aventura',
            defaults={
                'cajDes': 'Caja única del Mall Aventura',
                'cajEstado': 'ACTIVO',
                'sucurCod': branch_2,
                'usuCod': optometra1
            }
        )
        
        CashOpening.objects.get_or_create(
            cajCod=caja3,
            cajaApertuFechHora=timezone.now().replace(hour=8, minute=30, second=0),
            defaults={
                'usuCod': optometra1,
                'cajaAperMontInicial': 400.00,
                'cajaAperEstado': 'ABIERTA',
                'cajaAperObservacio': 'Caja Mall Aventura activa'
            }
        )
    
    if branch_3 and cajero2:
        caja4, _ = Cash.objects.get_or_create(
            cajNom='Caja Yanahuara',
            defaults={
                'cajDes': 'Caja de sucursal Yanahuara',
                'cajEstado': 'ACTIVO',
                'sucurCod': branch_3,
                'usuCod': cajero2
            }
        )
        
        CashOpening.objects.get_or_create(
            cajCod=caja4,
            cajaApertuFechHora=timezone.now().replace(hour=9, minute=0, second=0),
            defaults={
                'usuCod': cajero2,
                'cajaAperMontInicial': 350.00,
                'cajaAperEstado': 'ABIERTA',
                'cajaAperObservacio': 'Caja Yanahuara activa'
            }
        )


def remove_sample_cash_data(apps, schema_editor):
    """Elimina cajas y aperturas de prueba"""
    Cash = apps.get_model('cash', 'Cash')
    CashOpening = apps.get_model('cash', 'CashOpening')
    
    CashOpening.objects.all().delete()
    Cash.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('cash', '0002_alter_cash_cajnom'),
        ('Branch', '0005_load_sample_branches'),
        ('User', '0011_load_sample_users'),
    ]

    operations = [
        migrations.RunPython(load_sample_cash_data, remove_sample_cash_data),
    ]
