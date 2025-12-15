from django.shortcuts import render
from rest_framework.exceptions import ValidationError
from rest_framework import viewsets, permissions
from .models import Cash
from .serializers import CashSerializer, CashOpeningSerializer
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cash, CashOpening
from decimal import Decimal
from sales.models import Venta 

        

timezone = __import__('django.utils.timezone').utils.timezone

class CashViewSet(viewsets.ModelViewSet):
    serializer_class = CashSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_user_branch(self):
        return getattr(self.request.user, 'sucurCod', None)
    
    def get_cashier_branch(self, serializer):
        """Sucursal del cajero asignado en el serializer"""
        User = get_user_model()
        cashierUsuCod= serializer.validated_data.get("usuCod")
        if not cashierUsuCod:
            return None
        try:
            cashier = User.objects.get(pk=cashier_id)
            return getattr(cashier, "sucurCod", None)
        except User.DoesNotExist:
            return None


    def get_queryset(self):
        user = self.request.user
        if not user.roles.filter(rolNom__in=["GERENTE", "SUPERVISOR", "VENDEDOR","CAJERO"]).exists():
            return Cash.objects.none()

        if user.roles.filter(rolNom="CAJERO").exists():
            return Cash.objects.filter(usuCod=user.usuCod)

        if user.roles.filter(rolNom="VENDEDOR").exists():
            return Cash.objects.filter(usuCod=user.usuCod)
            
        if user.roles.filter(rolNom="GERENTE").exists() and user.sucurCod:
            return Cash.objects.filter(sucurCod=user.sucurCod)

        if user.roles.filter(rolNom="SUPERVISOR").exists() and user.sucurCod:
            return Cash.objects.filter(sucurCod=user.sucurCod)

        return Cash.objects.none()
    
    def perform_create(self, serializer):
        branch = self.get_user_branch()
        if not branch:
            # Aca si no tiene branch (gerente) se asignara la sucursal del cajero asignado
            branch = self.get_cashier_branch(serializer)
            if not branch:
                raise ValidationError("No se pudo determinar la sucursal (ni usuario ni cajero).")
        serializer.save(sucurCod=branch)


class CashOpeningViewSet(viewsets.ModelViewSet):
    serializer_class = CashOpeningSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user

        if user.roles.filter(rolNom="CAJERO").exists():
            return CashOpening.objects.filter(usuCod=user)

        if user.sucurCod:
            return CashOpening.objects.filter(cajCod__sucurCod=user.sucurCod)

        return CashOpening.objects.none()
    
    @action(detail=False, methods=['get'], url_path='by-cash/(?P<cajCod>[^/.]+)')
    def aperturas_por_caja(self, request, cajCod=None):
        user = request.user

        if user.roles.filter(rolNom="CAJERO").exists():
            aperturas = CashOpening.objects.filter(usuCod=user, cajCod=cajCod)
        elif user.sucurCod:
            aperturas = CashOpening.objects.filter(cajCod__sucurCod=user.sucurCod, cajCod=cajCod)
        else:
            return Response([], status=200)

        serializer = self.get_serializer(aperturas, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = self.request.user
        caja = serializer.validated_data['cajCod']

        # Validar que el cajero solo abra su caja asignada
        if user.roles.filter(rolNom="CAJERO").exists():
            if caja.usuCod != user:
                raise ValidationError("No puedes abrir una caja que no te fue asignada.")
        
        # NUEVO: Verificar que no haya otra apertura abierta para esta caja
        apertura_existente = CashOpening.objects.filter(
            cajCod=caja,
            cajaAperEstado="ABIERTA"
        ).exists()
        
        if apertura_existente:
            raise ValidationError(f"La caja {caja.cajNom} ya tiene una apertura abierta. Ciérrala antes de abrir una nueva.")
        
        #  NUEVO: Verificar que el usuario no tenga otra apertura abierta
        apertura_usuario = CashOpening.objects.filter(
            usuCod=user,
            cajaAperEstado="ABIERTA"
        ).exists()
        
        if apertura_usuario:
            raise ValidationError("Ya tienes una apertura abierta. Ciérrala antes de abrir otra.")
        
        serializer.save(usuCod=user)
    
    def perform_close(self, apertura, user, monto_cierre, observaciones=""):
        """Cierra una apertura de caja"""
        if apertura.usuCod != user:
            raise ValidationError("No puedes cerrar una apertura que no te pertenece.")

        if apertura.cajaAperEstado != "ABIERTA":
            raise ValidationError("La caja ya está cerrada.")

        esperado = apertura.cajaAperMontEsperado or apertura.cajaAperMontInicial
        diferencia = float(monto_cierre) - float(esperado)

        apertura.cajaAperMontCierre = monto_cierre
        apertura.cajaAperMontEsperado = esperado
        apertura.cajaAperDiferencia = diferencia
        apertura.cajaAperFechaHorCierre = timezone.now()
        apertura.cajaAperEstado = "CERRADA"
        apertura.cajaAperObservacio = observaciones  # Guardar observaciones error de escritura pero lo dejamos asi
        apertura.save()

    @action(detail=False, methods=['post'], url_path='close')
    def cerrar_caja(self, request):
        """Cierra la caja abierta del usuario actual"""
        user = request.user
        
        # Buscar apertura abierta según el rol
        if user.roles.filter(rolNom="CAJERO").exists():
            apertura = CashOpening.objects.filter(
                usuCod=user, 
                cajaAperEstado="ABIERTA"
            ).first()
        elif user.sucurCod:
            apertura = CashOpening.objects.filter(
                cajCod__sucurCod=user.sucurCod, 
                cajaAperEstado="ABIERTA"
            ).first()
        else:
            return Response(
                {"detail": "No se encontró apertura abierta."}, 
                status=404
            )

        if not apertura:
            return Response(
                {"detail": "No hay caja abierta para cerrar."}, 
                status=404
            )
        
        # Obtener datos del request
        monto_cierre = request.data.get("cajaAperMontCierre")
        observaciones = request.data.get("cajaAperObservacio", "")
        
        if monto_cierre is None:
            return Response(
                {"detail": "Debes enviar el monto de cierre."}, 
                status=400
            )

        try:
            #  Pasar las observaciones al método perform_close
            self.perform_close(apertura, user, monto_cierre, observaciones)
        except ValidationError as e:
            return Response(
                {"detail": str(e.detail)}, 
                status=400
            )

        return Response(
            {"detail": "Caja cerrada correctamente."}, 
            status=200
        )
    
    @action(detail=False, methods=['get'], url_path='open')
    def abrir_actual(self, request):
        """
        Devuelve la apertura ABIERTA actual para el usuario (si es CAJERO)
        o para la sucursal del usuario (GERENTE/SUPERVISOR).
        Retorna null (200) si no hay apertura abierta.
        """
        user = request.user

        if user.roles.filter(rolNom="CAJERO").exists():
            apertura = CashOpening.objects.filter(
                usuCod=user, 
                cajaAperEstado="ABIERTA"
            ).order_by('-cajaApertuFechHora').first()
        elif user.sucurCod:
            apertura = CashOpening.objects.filter(
                cajCod__sucurCod=user.sucurCod, 
                cajaAperEstado="ABIERTA"
            ).order_by('-cajaApertuFechHora').first()
        else:
            return Response(None, status=200)

        if not apertura:
            return Response(None, status=200)

        serializer = self.get_serializer(apertura)
        return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def session_sales(self, request):
        """Obtener resumen de ventas de la sesión actual"""
        user = request.user
        
        # Buscar apertura abierta según el rol (igual que en abrir_actual)
        if user.roles.filter(rolNom="CAJERO").exists():
            apertura = CashOpening.objects.filter(
                usuCod=user, 
                cajaAperEstado="ABIERTA"
            ).first()
        elif user.sucurCod:
            apertura = CashOpening.objects.filter(
                cajCod__sucurCod=user.sucurCod, 
                cajaAperEstado="ABIERTA"
            ).first()
        else:
            return Response({'error': 'No hay caja abierta'}, status=400)
        
        if not apertura:
            return Response({'error': 'No hay caja abierta'}, status=400)
        

        # Obtener ventas de esta sesión (relacionadas con esta apertura)
        ventas = Venta.objects.filter(
            cajaAperCod=apertura,
            ventAnulada=False
        )
        
        # Calcular totales por forma de pago
        ventas_por_forma = {
            'EFECTIVO': Decimal('0.00'),
            'TARJETA': Decimal('0.00'),
            'TRANSFERENCIA': Decimal('0.00'),
            'YAPE': Decimal('0.00'),
            'PLIN': Decimal('0.00'),
            'MIXTO': Decimal('0.00'),
        }
        
        total_ventas = Decimal('0.00')
        
        for venta in ventas:
            forma = venta.ventFormaPago
            monto = Decimal(str(venta.ventTotal))
            total_ventas += monto
            
            if forma in ventas_por_forma:
                ventas_por_forma[forma] += monto
        
        return Response({
            'total_ventas': float(total_ventas),
            'cantidad_ventas': ventas.count(),
            'ventas_por_forma_pago': {k: float(v) for k, v in ventas_por_forma.items()}
        })