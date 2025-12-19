from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from decimal import Decimal
from django.contrib.auth import get_user_model
from ..models import Venta, Branch, Caja

User = get_user_model()

class VentaFiltrosTests(APITestCase):
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username='vendedor_test', 
            password='password123'
        )
        self.sucursal = Branch.objects.create(sucurNom='Sucursal Test')
        self.caja = Caja.objects.create(
            usuCod=self.user,
            sucurCod=self.sucursal,
            cajaEstado='ABIERTA'
        )
        
        # Crear ventas con diferentes formas de pago
        self.venta_efectivo = Venta.objects.create(
            usuCod=self.user,
            sucurCod=self.sucursal,
            cajaAperCod=self.caja,
            ventFormaPago='EFECTIVO',
            cliNombreCom='Cliente Efectivo',
            ventTotal=Decimal('100.00')
        )
        
        self.venta_tarjeta = Venta.objects.create(
            usuCod=self.user,
            sucurCod=self.sucursal,
            cajaAperCod=self.caja,
            ventFormaPago='TARJETA',
            ventTarjetaTipo='CREDITO',
            cliNombreCom='Cliente Tarjeta',
            ventTotal=Decimal('200.00')
        )
        
        self.venta_transferencia = Venta.objects.create(
            usuCod=self.user,
            sucurCod=self.sucursal,
            cajaAperCod=self.caja,
            ventFormaPago='TRANSFERENCIA',
            ventReferenciaPago='TRF-123456',
            cliNombreCom='Cliente Transferencia',
            ventTotal=Decimal('300.00')
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_filtrar_por_forma_pago_efectivo(self):
        """Test: Filtrar ventas por forma de pago efectivo"""
        url = reverse('venta-list')
        response = self.client.get(url, {'forma_pago': 'EFECTIVO'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['ventFormaPago'], 'EFECTIVO')
        self.assertEqual(response.data[0]['cliNombreCom'], 'Cliente Efectivo')
    
    def test_filtrar_por_forma_pago_tarjeta(self):
        """Test: Filtrar ventas por forma de pago tarjeta"""
        url = reverse('venta-list')
        response = self.client.get(url, {'forma_pago': 'TARJETA'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['ventFormaPago'], 'TARJETA')
        self.assertEqual(response.data[0]['cliNombreCom'], 'Cliente Tarjeta')
    
    def test_sin_filtro_devuelve_todas_las_ventas(self):
        """Test: Sin filtro devuelve todas las ventas"""
        url = reverse('venta-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # Debería devolver las 3 ventas