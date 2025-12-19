from django.db.models.signals import post_save
from django.dispatch import receiver
from Branch.models import Branch
from .models import Product, BranchInventory

@receiver(post_save, sender=Product)
def create_inventories_for_global_product(sender, instance, created, **kwargs):
    """
    Cuando se crea un producto GLOBAL, crear inventario (stock=0)
    en TODAS las sucursales existentes.
    """
    if created and instance.prodOrigin == 'GLOBAL':
        branches = Branch.objects.all()
        inventarios = [
            BranchInventory(
                sucurCod=branch,
                prodCod=instance,
                invStock=0,
                invStockMin=5
            )
            for branch in branches
        ]
        BranchInventory.objects.bulk_create(inventarios, ignore_conflicts=True)


@receiver(post_save, sender=Branch)
def create_inventories_for_new_branch(sender, instance, created, **kwargs):
    """
    Cuando se crea una nueva sucursal, agregar inventario (stock=0)
    de TODOS los productos GLOBALES existentes.
    """
    if created:
        productos_globales = Product.objects.filter(prodOrigin='GLOBAL')
        inventarios = [
            BranchInventory(
                sucurCod=instance,
                prodCod=product,
                invStock=0,
                invStockMin=5
            )
            for product in productos_globales
        ]
        BranchInventory.objects.bulk_create(inventarios, ignore_conflicts=True)
