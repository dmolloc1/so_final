from django.db import models

class Branch(models.Model):
    DEPARTAMENTO_CHOICES = [
    ('AMAZONAS', 'Amazonas'),
    ('ANCASH', 'Áncash'),
    ('APURIMAC', 'Apurímac'),
    ('AREQUIPA', 'Arequipa'),
    ('AYACUCHO', 'Ayacucho'),
    ('CAJAMARCA', 'Cajamarca'),
    ('CALLAO', 'Callao'),
    ('CUSCO', 'Cusco'),
    ('HUANCAVELICA', 'Huancavelica'),
    ('HUANUCO', 'Huánuco'),
    ('ICA', 'Ica'),
    ('JUNIN', 'Junín'),
    ('LA_LIBERTAD', 'La Libertad'),
    ('LAMBAYEQUE', 'Lambayeque'),
    ('LIMA', 'Lima'),
    ('LORETO', 'Loreto'),
    ('MADRE_DE_DIOS', 'Madre de Dios'),
    ('MOQUEGUA', 'Moquegua'),
    ('PASCO', 'Pasco'),
    ('PIURA', 'Piura'),
    ('PUNO', 'Puno'),
    ('SAN_MARTIN', 'San Martín'),
    ('TACNA', 'Tacna'),
    ('TUMBES', 'Tumbes'),
    ('UCAYALI', 'Ucayali'),
    ]
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]   
    sucurCod = models.AutoField(primary_key=True)
    sucurNom = models.CharField(max_length=100)
    sucurDep = models.CharField(max_length=100, choices =   DEPARTAMENTO_CHOICES)
    sucurCiu = models.CharField(max_length=30)
    sucurDis = models.CharField(max_length=30)
    sucurDir = models.CharField(max_length=200)
    sucurTel = models.CharField(max_length=20)
    sucurEstado = models.CharField(choices = STATUS_CHOICES, default='Active' ,max_length = 10) #Cambio para seguir un estandar como suplier

class BranchUser(models.Model): ##Fue no se utilizara
    sucUsuCod = models.AutoField(primary_key=True)
    sucurCod = models.ForeignKey(Branch, on_delete=models.CASCADE)
    usuCod = models.ForeignKey('User.User', on_delete=models.CASCADE)
    sucUsuFechAsig  = models.DateField()