from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from decimal import Decimal
from django.contrib.auth import get_user_model
from ..models import Venta, Branch, Caja
from inventory.models import Product, BranchInventory

User = get_user_model()

class VentaRegistroPagoTests(APITestCase):
    
    def setUp(self):
        """Configuración inicial para todas las pruebas"""
        # Crear usuario
        self.user = User.objects.create_user(
            username='vendedor_test', 
            password='password123', 
            usuNombreCom='Vendedor Test'
        )
        
        # Crear sucursal
        self.sucursal = Branch.objects.create(sucurNom='Sucursal Principal')
        
        # Crear caja
        self.caja = Caja.objects.create(
            usuCod=self.user,
            sucurCod=self.sucursal,
            cajaEstado='ABIERTA',
            cajaDescr='Caja Test'
        )
        
        # Crear venta de prueba
        self.venta = Venta.objects.create(
            usuCod=self.user,
            sucurCod=self.sucursal,
            cajaAperCod=self.caja,
            cliNombreCom='Cliente de Prueba',
            cliDocTipo='DNI',
            cliDocNum='87654321',
            ventTotal=Decimal('118.00'),
            ventSaldo=Decimal('118.00'),
            ventFormaPago='EFECTIVO'
        )
        
        # Autenticar cliente para las pruebas
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_registrar_pago_efectivo_exitoso(self):
        """Test: Registrar pago en efectivo exitoso"""
        url = reverse('venta-registrar-pago', kwargs={'pk': self.venta.pk})
        data = {
            'monto': '50.00',
            'forma_pago': 'EFECTIVO'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Verificar respuesta
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que la venta se actualizó correctamente
        self.venta.refresh_from_db()
        self.assertEqual(self.venta.ventAdelanto, Decimal('50.00'))
        self.assertEqual(self.venta.ventFormaPago, 'EFECTIVO')
        self.assertEqual(self.venta.ventSaldo, Decimal('68.00'))
    
    def test_registrar_pago_tarjeta_exitoso(self):
        """Test: Registrar pago con tarjeta exitoso"""
        url = reverse('venta-registrar-pago', kwargs={'pk': self.venta.pk})
        data = {
            'monto': '100.00',
            'forma_pago': 'TARJETA',
            'tarjeta_tipo': 'CREDITO'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.venta.refresh_from_db()
        self.assertEqual(self.venta.ventAdelanto, Decimal('100.00'))
        self.assertEqual(self.venta.ventFormaPago, 'TARJETA')
        self.assertEqual(self.venta.ventTarjetaTipo, 'CREDITO')
    
    def test_registrar_pago_tarjeta_sin_tipo_error(self):
        """Test: Error al pagar con tarjeta sin especificar tipo"""
        url = reverse('venta-registrar-pago', kwargs={'pk': self.venta.pk})
        data = {
            'monto': '50.00',
            'forma_pago': 'TARJETA'
            # Falta tarjeta_tipo
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tarjeta_tipo', response.data)


class VentaCambiarFormaPagoTests(APITestCase):
    
    def setUp(self):
        """Configuración inicial"""
        self.user = User.objects.create_user(
            username='cajero_test', 
            password='password123'
        )
        self.sucursal = Branch.objects.create(sucurNom='Sucursal Test')
        self.caja = Caja.objects.create(
            usuCod=self.user,
            sucurCod=self.sucursal,
            cajaEstado='ABIERTA'
        )
        
        self.venta = Venta.objects.create(
            usuCod=self.user,
            sucurCod=self.sucursal,
            cajaAperCod=self.caja,
            cliNombreCom='Cliente Test',
            ventFormaPago='EFECTIVO',
            ventTotal=Decimal('100.00')
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_cambiar_forma_pago_tarjeta_exitoso(self):
        """Test: Cambiar forma de pago a tarjeta exitoso"""
        url = reverse('venta-cambiar-forma-pago', kwargs={'pk': self.venta.pk})
        data = {
            'forma_pago': 'TARJETA',
            'tarjeta_tipo': 'DEBITO'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.venta.refresh_from_db()
        self.assertEqual(self.venta.ventFormaPago, 'TARJETA')
        self.assertEqual(self.venta.ventTarjetaTipo, 'DEBITO')