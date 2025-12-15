from django.db import models
from django.core.validators import RegexValidator, EmailValidator
from django.core.exceptions import ValidationError

class Supplier(models.Model):
    # Modelo de Proveedores
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]
    # RUC validator (11 digitos para Peru)
    rucValidator = RegexValidator(
        regex=r'^\d{11}$',
        message='RUC must be exactly 11 digits'
    )
    # Phone validator (9 digitos para Peru)
    phoneValidator = RegexValidator(
        regex=r'^\d{9}$',
        message='Phone must be exactly 9 digits'
    )

    # Primary Key
    provCod = models.AutoField(primary_key=True, verbose_name="Supplier Code")
    provRuc = models.CharField(
        max_length=11,
        unique=True,
        validators=[rucValidator],
        verbose_name="RUC"
    )
    provRazSocial = models.CharField(max_length=255, verbose_name="Razon Social")
    provDirec = models.TextField(verbose_name="Address")
    provTele = models.CharField(
        max_length=9,
        validators=[phoneValidator],
        verbose_name="Phone"
    )
    provEmail = models.EmailField(
        validators=[EmailValidator()],
        verbose_name="Email"
    )
    provCiu = models.CharField(max_length=100, verbose_name="City")
    provEstado = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Active', verbose_name="Status")
    
    
    def __str__(self):
        return f"{self.provRazSocial} - RUC: {self.provRuc}"
    
    def clean(self):
        super().clean()
        
        # Validacion RUC
        if not self.provRuc.isdigit() or len(self.provRuc) != 11:
            raise ValidationError({
                'provRuc': 'El RUC debe tener exactamente 11 dígitos numéricos'
            })
        
        # Validacion phone 
        if not self.provTele.isdigit() or len(self.provTele) != 9:
            raise ValidationError({
                'provTele': 'El número de teléfono debe tener exactamente 9 dígitos numéricos'
            })
        
        # Validacion business name 
        if len(self.provRazSocial.strip()) < 3:
            raise ValidationError({
                'provRazSocial': 'El nombre de la empresa debe tener al menos 3 caracteres.'
            })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_active(self):
        return self.provEstado == 'Active'
