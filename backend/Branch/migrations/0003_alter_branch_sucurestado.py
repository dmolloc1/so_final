from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Branch', '0002_branch_sucurdep_branch_sucurdis_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='branch',
            name='sucurEstado',
            field=models.CharField(choices=[('Active', 'Active'), ('Inactive', 'Inactive')], default='Active'),
        ),
    ]
