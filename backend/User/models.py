from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class Role(models.Model):
    NOM_CHOICES = [
        ('GERENTE', 'Gerente'),
        ('CAJERO', 'Cajero'),
        ('VENDEDOR', 'Vendedor'),
        ('OPTOMETRA', 'Optometra'),
        ('SUPERVISOR', 'Supervisor'),
        ('LOGISTICA', 'Logística'),
    ]

    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('DESACTIVADO', 'Desactivado'),
        ('SUSPENDIDO', 'Suspendido'),
    ]

    NIVEL_CHOICES = [
        (0, 'Nivel 0'),
        (1, 'Nivel 1'),
        (2, 'Nivel 2'),
        (3, 'Nivel 3'),
        (4, 'Nivel 4'),

    ]

    rolCod = models.AutoField(primary_key=True)
    rolNom = models.CharField(max_length=50, choices=NOM_CHOICES)
    rolDes = models.CharField(max_length = 50)
    rolEstado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')
    rolNivel = models.IntegerField(choices=NIVEL_CHOICES, default=1)
    
# Create your models here.
class CustomUserManager(BaseUserManager):
    def create_user(self, usuNom, usuContra, usuEmail, **extra_fields):
        if not usuNom:
            raise ValueError("El usuario debe tener un nombre de usuario")
        if not usuEmail:
            raise ValueError("El usuario debe tener un correo electrónico")

        email = self.normalize_email(usuEmail)
        user = self.model(usuNom=usuNom, usuEmail=email, **extra_fields)
        user.set_password(usuContra)
        user.save(using=self._db)
        return user
    def create_superuser(self, usuNom, usuContra, usuEmail=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(usuNom, usuContra, usuEmail, **extra_fields)

class User(AbstractBaseUser,  PermissionsMixin):
    usuCod = models.AutoField(primary_key=True)
    usuNom = models.CharField(unique= True, max_length = 20)
    password = models.CharField(max_length=128) #Necesario para django
    usuNombreCom = models.CharField(max_length=60)
    usuDNI = models.CharField(max_length = 8)
    usuTel = models.CharField(max_length = 9)
    usuEmail = models.EmailField(unique = True)
    usuEstado = models.BooleanField(default = True)
    roles = models.ManyToManyField(Role) ## Cambio Django crea tabla asociativa de por medio
    
    # Campos requeridos por Django
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    sucurCod = models.ForeignKey(
        'Branch.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Sucursal Asignada"
    )

    objects = CustomUserManager() 

    USERNAME_FIELD = 'usuNom'
    REQUIRED_FIELDS = ['usuEmail']

    def __str__(self):
        return str( self.usuNom)

class OptometraUser(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='optometra'
    )

    optCargo = models.CharField(max_length=50)
    optCMP = models.CharField(max_length=20, unique=True)
    optRNE = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"Optómetra: {self.user.usuNom}"
