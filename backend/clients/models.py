from django.db import models

class Cliente(models.Model):
    TIPO_DOCUMENTO_CHOICES = [
        ('DNI', 'DNI'),
        ('CE', 'Carnet de extranjeria'),
    ]
    
    cliCod = models.AutoField(primary_key=True)
    cliTipoDoc = models.CharField(max_length=10, choices=TIPO_DOCUMENTO_CHOICES, default='DNI')
    cliNumDoc = models.CharField(max_length=20, unique=True)    
    cliNombre = models.CharField(max_length=100, default='')   
    cliApellido = models.CharField(max_length=100, default='') 
    cliRazSocial = models.CharField(max_length=100, blank=True, null=True)
    cliDirec = models.CharField(max_length=200)
    cliTelef = models.CharField(max_length=9)
    cliEmail = models.EmailField(unique=True)    
    cliFechaNac = models.DateField()
    sucurCod = models.ForeignKey('Branch.Branch', on_delete=models.PROTECT, verbose_name="Sucursal", db_column='sucurCod', related_name='clientes', blank=True, null=True)
    
    def __str__(self):
        return f"{self.cliNombre} {self.cliApellido} ({self.cliNumDoc})"