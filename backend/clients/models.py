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
    sucurCod = models.PositiveIntegerField(default=0)
    cliFechaNac = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.cliNombre} {self.cliApellido} ({self.cliNumDoc})"