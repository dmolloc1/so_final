from django.db import models
# Crear caja solo designado a supervisor y gerente con sucursal asociada
# Create your models here.
from Branch.models import Branch 
from User.models import User    
class Cash(models.Model):
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('DESACTIVADO', 'Desactivado'),
        ('SUSPENDIDO', 'Suspendido'),
    ]
    cajCod = models.AutoField(primary_key=True)
    sucurCod = models.ForeignKey(Branch, on_delete=models.CASCADE)
    usuCod = models.ForeignKey(User, on_delete=models.CASCADE)  # Usuario que creó la caja
    cajNom = models.CharField(unique = True, max_length = 50)
    cajDes = models.CharField(blank=True, null=True)
    cajEstado = models.CharField(choices=ESTADO_CHOICES, default='ACTIVO')

class CashOpening(models.Model):
    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('CERRADA', 'Cerrada'),
        ('ANULADA', 'Anulada'),
    ]

    cajaAperCod = models.AutoField(primary_key=True)
    cajCod = models.ForeignKey(Cash, on_delete=models.CASCADE, related_name="aperturas")
    usuCod = models.ForeignKey(User, on_delete=models.CASCADE)  # Cajero que abrió la caja

    cajaApertuFechHora = models.DateTimeField(auto_now_add=True)
    cajaAperMontInicial = models.DecimalField(max_digits=10, decimal_places=2)

    cajaAperFechaHorCierre = models.DateTimeField(null=True, blank=True)
    cajaAperMontCierre = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cajaAperMontEsperado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cajaAperDiferencia = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    cajaAperEstado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='ABIERTA')
    cajaAperObservacio = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Apertura de Caja"
        verbose_name_plural = "Aperturas de Caja"

    def __str__(self):
        return f"Apertura #{self.cajaAperCod} - {self.cajCod.cajNom} ({self.cajaAperEstado})"