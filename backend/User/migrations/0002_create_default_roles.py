from django.db import migrations
# Crea los roles en la BD por defecto
def create_roles(apps, schema_editor): 
    Role = apps.get_model('User', 'Role')
    roles = [
        ('GERENTE', 'Gerente', 0),
        ('CAJERO', 'Cajero', 2),
        ('VENDEDOR', 'Vendedor', 2),
        ('OPTOMETRA', 'Optometra', 4),
        ('SUPERVISOR', 'Supervisor', 1),
        ('LOGISTICA', 'Logística', 3),
    ]
    for cod, nombre, nivel in roles:
        Role.objects.update_or_create(
            rolNom=cod,
            defaults={
                'rolDes': nombre,
                'rolEstado': 'ACTIVO',
                'rolNivel': nivel
            }
        )



class Migration(migrations.Migration):

    dependencies = [
        ('User', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_roles),
    ]