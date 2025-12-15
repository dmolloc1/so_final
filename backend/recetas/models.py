from django.db import models
from clients.models import Cliente 

class Receta(models.Model):
    receCod = models.AutoField(primary_key=True)
    receFech = models.DateField(verbose_name="Fecha")
    receEsfeD = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Esfera OD")
    receCilinD = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Cilindro OD")
    receEjeD = models.IntegerField(verbose_name="Eje OD")
    receEsfel = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Esfera OI")
    receCilinl = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Cilindro OI")
    receEjel = models.IntegerField(verbose_name="Eje OI")
    receDistPupilar = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="DP")
    receTipoLent = models.CharField(max_length=100, verbose_name="Tipo Lente")
    receObserva = models.TextField(blank=True, null=True, verbose_name="Observaciones")
    receRegistro = models.DateTimeField(auto_now_add=True, verbose_name="Fecha Registro")
    receEstado = models.CharField(max_length=50, default='Activo')
    sucurCod = models.ForeignKey('Branch.Branch', on_delete=models.PROTECT, verbose_name="Sucursal", db_column='sucurCod', related_name='recetas', blank=True, null=True)

    # CONEXIONES
    cliCod = models.ForeignKey(
        Cliente, 
        on_delete=models.CASCADE, 
        verbose_name="Paciente",
        db_column='cliCod',
        related_name='recetas'
    )

    usuCod = models.ForeignKey(
        'User.User', 
        on_delete=models.PROTECT, 
        limit_choices_to={'roles__rolNom': 'OPTOMETRA'}, 
        verbose_name="Optómetra",
        db_column='usuCod',
        related_name='recetas_realizadas'
    )

    def __str__(self):
        return f"Receta {self.receCod} - {self.receTipoLent}"

    class Meta:
        verbose_name = "Receta"
        verbose_name_plural = "Recetas"