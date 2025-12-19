# Generated migration for sample data

from django.db import migrations


def load_sample_clients(apps, schema_editor):
    """Carga clientes de prueba"""
    Cliente = apps.get_model('clients', 'Cliente')
    
    clients_data = [
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '12345678',
            'cliNombre': 'Juan',
            'cliApellido': 'Pérez García',
            'cliDirec': 'Av. Bolognesi 123',
            'cliTelef': '987654321',
            'cliEmail': 'juan.perez@gmail.com',
            'sucurCod': 1
        },
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '23456789',
            'cliNombre': 'María',
            'cliApellido': 'López Rodríguez',
            'cliDirec': 'Calle Lima 456',
            'cliTelef': '987654322',
            'cliEmail': 'maria.lopez@gmail.com',
            'sucurCod': 1
        },
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '34567890',
            'cliNombre': 'Carlos',
            'cliApellido': 'Mamani Quispe',
            'cliDirec': 'Av. Ejército 789',
            'cliTelef': '987654323',
            'cliEmail': 'carlos.mamani@hotmail.com',
            'sucurCod': 1
        },
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '45678901',
            'cliNombre': 'Ana',
            'cliApellido': 'Torres Huamán',
            'cliDirec': 'Jr. Puno 321',
            'cliTelef': '987654324',
            'cliEmail': 'ana.torres@yahoo.com',
            'sucurCod': 2
        },
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '56789012',
            'cliNombre': 'Roberto',
            'cliApellido': 'Chávez Silva',
            'cliDirec': 'Av. Venezuela 654',
            'cliTelef': '987654325',
            'cliEmail': 'roberto.chavez@gmail.com',
            'sucurCod': 2
        },
        {
            'cliTipoDoc': 'CE',
            'cliNumDoc': '001234567',
            'cliNombre': 'Gabriela',
            'cliApellido': 'Fernández',
            'cliDirec': 'Calle San Martín 111',
            'cliTelef': '987654326',
            'cliEmail': 'gabriela.f@gmail.com',
            'sucurCod': 3
        },
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '67890123',
            'cliNombre': 'Luis',
            'cliApellido': 'Ramos Condori',
            'cliDirec': 'Av. Goyeneche 222',
            'cliTelef': '987654327',
            'cliEmail': 'luis.ramos@gmail.com',
            'sucurCod': 1
        },
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '78901234',
            'cliNombre': 'Sofia',
            'cliApellido': 'Vargas Apaza',
            'cliDirec': 'Calle Mercaderes 333',
            'cliTelef': '987654328',
            'cliEmail': 'sofia.vargas@gmail.com',
            'sucurCod': 2
        },
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '89012345',
            'cliNombre': 'Diego',
            'cliApellido': 'Flores Mamani',
            'cliDirec': 'Jr. Arequipa 444',
            'cliTelef': '987654329',
            'cliEmail': 'diego.flores@outlook.com',
            'sucurCod': 1
        },
        {
            'cliTipoDoc': 'DNI',
            'cliNumDoc': '90123456',
            'cliNombre': 'Valentina',
            'cliApellido': 'Gutiérrez Quispe',
            'cliDirec': 'Av. Dolores 555',
            'cliTelef': '987654330',
            'cliEmail': 'valentina.g@gmail.com',
            'sucurCod': 3
        },
    ]
    
    for client_data in clients_data:
        Cliente.objects.get_or_create(
            cliNumDoc=client_data['cliNumDoc'],
            defaults=client_data
        )


def remove_sample_clients(apps, schema_editor):
    """Elimina los clientes de prueba"""
    Cliente = apps.get_model('clients', 'Cliente')
    Cliente.objects.filter(cliEmail__contains='@').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0003_remove_cliente_clinomcomp_cliente_cliapellido_and_more'),
    ]

    operations = [
        migrations.RunPython(load_sample_clients, remove_sample_clients),
    ]
