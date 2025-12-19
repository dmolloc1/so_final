from django.db import models
from clients.models import Cliente

class Recipe(models.Model):
    recCod = models.AutoField(primary_key=True)

    # Datos generales
    recFecha = models.DateField(auto_now_add=True)
    recTipoLente = models.CharField(max_length=100)
    recEstado = models.CharField(max_length=50, default='Activo')
    recObservaciones = models.TextField(blank=True, null=True)

    # Distancia interpupilar
    dpGeneral = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Metricas de receta
    lejos_od_esf = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    lejos_od_cil = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    lejos_od_eje = models.IntegerField(null=True, blank=True)
    lejos_od_avcc = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    lejos_od_dip = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    lejos_oi_esf = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    lejos_oi_cil = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    lejos_oi_eje = models.IntegerField(null=True, blank=True)
    lejos_oi_avcc = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    lejos_oi_dip = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    cerca_od_esf = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cerca_od_cil = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cerca_od_eje = models.IntegerField(null=True, blank=True)
    cerca_od_add = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    cerca_oi_esf = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cerca_oi_cil = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cerca_oi_eje = models.IntegerField(null=True, blank=True)
    cerca_oi_add = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    
    #Otros campos
    diagnostico = models.JSONField(default=list, blank=True)

    # Relaciones
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='recipes'
    )

    optometra = models.ForeignKey(
        'User.User',
        on_delete=models.PROTECT,
        related_name='recipes_realizadas',
        limit_choices_to={'roles__rolNom': 'OPTOMETRA'}
    )

    sucurCod = models.ForeignKey(
        'Branch.Branch',
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Recipe {self.recCod}"
