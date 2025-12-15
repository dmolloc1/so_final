from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
import django_filters
from rest_framework.exceptions import ValidationError

from Branch.models import Branch
from User.models import User
from django.conf import settings

import requests
from django.http import HttpResponse

from .models import Venta, VentaDetalle, Comprobante, ComprobanteDetalle
from .serializers import (
    VentaListSerializer, VentaCreateSerializer, VentaDetailSerializer, 
    VentaUpdateSerializer, PagoSerializer, AnularVentaSerializer,
    ComprobanteListSerializer, ComprobanteDetailSerializer, ComprobanteCreateSerializer,
    VentaReporteSerializer, EstadisticasVentasSerializer,
    VentaDetalleSerializer 
)

###################################################################################
# FILTROS PARA VENTA
###################################################################################

class VentaFilter(django_filters.FilterSet):
    """Filtros avanzados para ventas"""
    
    # Búsqueda por texto (nombre cliente, documento, observaciones)
    search = django_filters.CharFilter(method='filter_search')
    
    # Filtros por fechas
    fecha_desde = django_filters.DateFilter(field_name='ventFecha', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='ventFecha', lookup_expr='lte')
    
    # Filtros por estados
    estado_venta = django_filters.ChoiceFilter(choices=Venta.ESTADO_VENTA)
    estado_recojo = django_filters.ChoiceFilter(choices=Venta.ESTADO_PEDIDO)
    anulada = django_filters.BooleanFilter(field_name='ventAnulada')
    
    # Filtros por cliente
    cliente_nombre = django_filters.CharFilter(field_name='cliNombreCom', lookup_expr='icontains')
    cliente_documento = django_filters.CharFilter(field_name='cliDocNum', lookup_expr='exact')
    cliente_tipo_doc = django_filters.ChoiceFilter(choices=[('DNI', 'DNI'), ('RUC', 'RUC'), ('CE', 'CE')])
    
    # Filtros por montos
    monto_min = django_filters.NumberFilter(field_name='ventTotal', lookup_expr='gte')
    monto_max = django_filters.NumberFilter(field_name='ventTotal', lookup_expr='lte')
    
    # Filtros por relaciones
    vendedor = django_filters.NumberFilter(field_name='usuCod__id')
    sucursal = django_filters.NumberFilter(field_name='sucurCod__id')
    caja = django_filters.NumberFilter(field_name='cajaAperCod__id')
    
    # Filtro por forma de pago
    forma_pago = django_filters.ChoiceFilter(choices=Venta.FORMA_PAGO)

    class Meta:
        model = Venta
        fields = [
            'search', 'fecha_desde', 'fecha_hasta', 'estado_venta', 'estado_recojo',
            'anulada', 'cliente_nombre', 'cliente_documento', 'cliente_tipo_doc',
            'monto_min', 'monto_max', 'vendedor', 'sucursal', 'caja', 'forma_pago'
        ]

    def filter_search(self, queryset, name, value):
        """Búsqueda en múltiples campos"""
        if value:
            return queryset.filter(
                Q(cliNombreCom__icontains=value) |
                Q(cliDocNum__icontains=value) |
                Q(ventObservaciones__icontains=value) |
                Q(ventCod__icontains=value)  # Si quieres buscar por código de venta
            )
        return queryset

###################################################################################
# VIEWSETS PARA VENTA
###################################################################################

class VentaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar ventas con filtros avanzados
    """
    permission_classes = [IsAuthenticated]
    queryset = Venta.objects.all().select_related(
        'usuCod', 'sucurCod', 'cajaAperCod'
    ).prefetch_related('ventadetalle_set')
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VentaFilter
    search_fields = ['cliNombreCom', 'cliDocNum', 'ventObservaciones']
    ordering_fields = ['ventFecha', 'ventTotal', 'ventCod', 'cliNombreCom']
    ordering = ['-ventFecha']  # Orden por defecto: más recientes primero

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return VentaCreateSerializer
        elif self.action == 'list':
            return VentaListSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return VentaDetailSerializer
        return VentaListSerializer

    def get_queryset(self):
        """Personalizar queryset según permisos y parámetros"""
        queryset = super().get_queryset()
        
        # Filtrar por sucursal si el usuario tiene sucursal asignada
        user = self.request.user
        if hasattr(user, 'sucurCod') and user.sucurCod:
            queryset = queryset.filter(sucurCod=user.sucurCod)
        
        # Filtrar por fechas si se proporcionan parámetros específicos
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        
        if fecha_inicio and fecha_fin:
            try:
                fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
                fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
                queryset = queryset.filter(
                    ventFecha__date__range=[fecha_inicio, fecha_fin]
                )
            except ValueError:
                pass
        
        return queryset

    @action(detail=True, methods=['post'])
    def registrar_pago(self, request, pk=None):
        """Registrar un pago para la venta"""
        venta = self.get_object()
        serializer = PagoSerializer(
            data=request.data, 
            context={'venta': venta}
        )
        
        if serializer.is_valid():
            try:
                resultado = venta.registrar_pago(
                    monto=serializer.validated_data['monto'],
                    forma_pago=serializer.validated_data['forma_pago'],
                    referencia_pago=serializer.validated_data.get('referencia_pago', ''),
                    tarjeta_tipo=serializer.validated_data.get('tarjeta_tipo', '')
                )
                return Response(resultado, status=status.HTTP_200_OK)
            except ValidationError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        """Anular una venta"""
        venta = self.get_object()
        serializer = AnularVentaSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                venta.anular_venta(serializer.validated_data['motivo'])
                return Response(
                    {'mensaje': 'Venta anulada correctamente'}, 
                    status=status.HTTP_200_OK
                )
            except ValidationError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def enviar_laboratorio(self, request, pk=None):
        """Enviar venta al laboratorio"""
        venta = self.get_object()
        try:
            venta.enviar_a_laboratorio()
            return Response(
                {'mensaje': 'Venta enviada al laboratorio'}, 
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def marcar_listo(self, request, pk=None):
        """Marcar venta como lista para recoger"""
        venta = self.get_object()
        try:
            venta.marcar_listo_para_recoger()
            return Response(
                {'mensaje': 'Venta marcada como lista para recoger'}, 
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def marcar_entregado(self, request, pk=None):
        """Marcar venta como entregada"""
        venta = self.get_object()
        try:
            venta.marcar_entregado()
            return Response(
                {'mensaje': 'Venta marcada como entregada'}, 
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def reportes(self, request):
        """Endpoint para reportes de ventas"""
        queryset = self.get_queryset()
        
        # Aplicar filtros adicionales para reportes
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        sucursal = request.query_params.get('sucursal')
        vendedor = request.query_params.get('vendedor')
        
        if fecha_inicio and fecha_fin:
            try:
                fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
                fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
                queryset = queryset.filter(ventFecha__date__range=[fecha_inicio, fecha_fin])
            except ValueError:
                pass
        
        if sucursal:
            queryset = queryset.filter(sucurCod_id=sucursal)
        
        if vendedor:
            queryset = queryset.filter(usuCod_id=vendedor)
        
        serializer = VentaReporteSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de ventas"""
        fecha_inicio = request.query_params.get('fecha_inicio', timezone.now().date() - timedelta(days=30))
        fecha_fin = request.query_params.get('fecha_fin', timezone.now().date())
        
        try:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcular estadísticas
        ventas = Venta.objects.filter(
            ventFecha__date__range=[fecha_inicio, fecha_fin],
            ventAnulada=False
        )
        
        total_ventas = sum(venta.ventTotal for venta in ventas)
        cantidad_ventas = ventas.count()
        promedio_venta = total_ventas / cantidad_ventas if cantidad_ventas > 0 else 0
        
        # Ventas por estado
        ventas_por_estado = {}
        for estado in Venta.ESTADO_VENTA:
            count = ventas.filter(ventEstado=estado[0]).count()
            ventas_por_estado[estado[1]] = count
        
        # Ventas por forma de pago
        ventas_por_forma_pago = {}
        for forma_pago in Venta.FORMA_PAGO:
            count = ventas.filter(ventFormaPago=forma_pago[0]).count()
            ventas_por_forma_pago[forma_pago[1]] = count
        
        # Ventas por sucursal
        ventas_por_sucursal = {}
        sucursales = Branch.objects.all()
        for sucursal in sucursales:
            count = ventas.filter(sucurCod=sucursal).count()
            ventas_por_sucursal[sucursal.sucurNom] = count
        
        data = {
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_ventas': total_ventas,
            'cantidad_ventas': cantidad_ventas,
            'promedio_venta': promedio_venta,
            'ventas_por_estado': ventas_por_estado,
            'ventas_por_forma_pago': ventas_por_forma_pago,
            'ventas_por_sucursal': ventas_por_sucursal
        }
        
        serializer = EstadisticasVentasSerializer(data)
        return Response(serializer.data)

###################################################################################
# FILTROS PARA COMPROBANTE
###################################################################################

class ComprobanteFilter(django_filters.FilterSet):
    """Filtros para comprobantes"""
    
    search = django_filters.CharFilter(method='filter_search')
    fecha_desde = django_filters.DateFilter(field_name='comprFechaEmision', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='comprFechaEmision', lookup_expr='lte')
    tipo = django_filters.ChoiceFilter(choices=Comprobante.TIPO_COMPROBANTE)
    estado_sunat = django_filters.ChoiceFilter(choices=Comprobante.ESTADO_SUNAT)
    serie = django_filters.CharFilter(field_name='comprSerie', lookup_expr='exact')
    correlativo = django_filters.NumberFilter(field_name='comprCorrelativo')
    cliente = django_filters.CharFilter(field_name='comprRazonSocialReceptor', lookup_expr='icontains')
    ruc_cliente = django_filters.CharFilter(field_name='comprNumDocReceptor', lookup_expr='exact')

    class Meta:
        model = Comprobante
        fields = [
            'search', 'fecha_desde', 'fecha_hasta', 'tipo', 'estado_sunat',
            'serie', 'correlativo', 'cliente', 'ruc_cliente'
        ]

    def filter_search(self, queryset, name, value):
        """Búsqueda en múltiples campos"""
        if value:
            return queryset.filter(
                Q(comprRazonSocialReceptor__icontains=value) |
                Q(comprNumDocReceptor__icontains=value) |
                Q(comprSerie__icontains=value) |
                Q(comprCorrelativo__icontains=value)
            )
        return queryset

###################################################################################
# VIEWSETS PARA COMPROBANTE
###################################################################################

class ComprobanteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar comprobantes
    """
    permission_classes = [IsAuthenticated]
    queryset = Comprobante.objects.all().select_related('ventCod')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ComprobanteFilter
    search_fields = [
        'comprRazonSocialReceptor', 'comprNumDocReceptor', 
        'comprSerie', 'comprCorrelativo'
    ]
    ordering_fields = ['comprFechaEmision', 'comprTotalVenta', 'comprCod']
    ordering = ['-comprFechaEmision']

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return ComprobanteCreateSerializer
        elif self.action == 'list':
            return ComprobanteListSerializer
        return ComprobanteDetailSerializer

    def get_queryset(self):
        """Personalizar queryset según permisos"""
        queryset = super().get_queryset()
        
        # Filtrar por sucursal si el usuario tiene sucursal asignada
        user = self.request.user
        if hasattr(user, 'sucurCod') and user.sucurCod:
            queryset = queryset.filter(ventCod__sucurCod=user.sucurCod)
        
        # Filtrar por venta si se proporciona el parámetro
        venta_codigo = self.request.query_params.get('venta_codigo')
        if venta_codigo:
            queryset = queryset.filter(ventCod_id=venta_codigo)
        
        return queryset

    @action(detail=True, methods=['post'])
    def enviar_sunat(self, request, pk=None):
        """Envía comprobante a SUNAT"""
        comprobante = self.get_object()
        
        try:
            resultado = comprobante.enviar_a_sunat()
            
            return Response({
                'mensaje': 'Comprobante enviado a SUNAT',
                'estado': comprobante.comprEstadoSUNAT,
                'mensaje_sunat': comprobante.comprMensajeSUNAT,
                'comprobante': comprobante.comprobante_completo,
                'detalles': resultado
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def reenviar_sunat(self, request, pk=None):
        """Reenvía comprobante a SUNAT"""
        comprobante = self.get_object()
        
        try:
            resultado = comprobante.reenviar_a_sunat()
            
            return Response({
                'mensaje': 'Comprobante reenviado a SUNAT',
                'estado': comprobante.comprEstadoSUNAT,
                'mensaje_sunat': comprobante.comprMensajeSUNAT,
                'comprobante': comprobante.comprobante_completo,
                'detalles': resultado
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(detail=True, methods=['get'])
    def estado_sunat(self, request, pk=None):
        """Consulta estado del comprobante en SUNAT"""
        comprobante = self.get_object()
        
        return Response({
            'comprobante': comprobante.comprobante_completo,
            'estado': comprobante.comprEstadoSUNAT,
            'estado_display': comprobante.get_comprEstadoSUNAT_display(),
            'mensaje': comprobante.comprMensajeSUNAT,
            'fecha_envio': comprobante.comprFechaEnvio,
            'fecha_respuesta': comprobante.comprFechaRespuesta,
            'puede_reenviar': comprobante.puede_reenviar,
            'fue_aceptado': comprobante.fue_aceptado
        })
    
    @action(detail=False, methods=['get'])
    def verificar_servicio(self, request):
        """Verifica si el servicio SUNAT está disponible"""
        from .sunat_client import SunatClient
        
        try:
            sunat_client = SunatClient()
            disponible = sunat_client.verificar_estado_servicio()
            
            return Response({
                'servicio_disponible': disponible,
                'servicio_url': getattr(settings, 'SUNAT_SERVICE_URL', 'No configurado')
            })
            
        except Exception as e:
            return Response({
                'servicio_disponible': False,
                'error': str(e)
            })
    
    @action(detail=True, methods=['get'])
    def descargar_xml(self, request, pk=None):
        """Descargar XML directamente desde el microservicio"""
        comprobante = self.get_object()
        
        try:
            print(f"Descargando XML para {comprobante.comprobante_completo}")
            
            if comprobante.comprEstadoSUNAT != 'ACEPTADO':
                return Response(
                    {'error': 'Solo se puede descargar XML de comprobantes aceptados por SUNAT'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 
            xml_url = f"http://localhost:8001/storage/xml/{comprobante.comprobante_completo}.xml"
            print(f"Descargando desde: {xml_url}")
            
            response = requests.get(xml_url, timeout=30)
            
            if response.status_code == 200:
                print(f"✅ XML descargado - Tamaño: {len(response.content)} bytes")
                
                django_response = HttpResponse(
                    response.content, 
                    content_type='application/xml'
                )
                django_response['Content-Disposition'] = f'attachment; filename="{comprobante.comprobante_completo}.xml"'
                return django_response
            else:
                print(f"❌ Error del microservicio: {response.status_code}")
                return Response(
                    {'error': f'Archivo XML no encontrado'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return Response(
                {'error': f'Error descargando XML: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def descargar_cdr(self, request, pk=None):
        """Descargar CDR directamente desde el microservicio"""
        comprobante = self.get_object()
        
        try:
            print(f"🔍 Descargando CDR para {comprobante.comprobante_completo}")
            
            if comprobante.comprEstadoSUNAT != 'ACEPTADO':
                return Response(
                    {'error': 'Solo se puede descargar CDR de comprobantes aceptados por SUNAT'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # URL CORREGIDA - sin /public/ al inicio
            cdr_url = f"http://localhost:8001/storage/cdr/R-{comprobante.comprobante_completo}.zip"
            print(f"Descargando desde: {cdr_url}")
            
            response = requests.get(cdr_url, timeout=30)
            
            if response.status_code == 200:
                print(f"✅ CDR descargado - Tamaño: {len(response.content)} bytes")
                
                django_response = HttpResponse(
                    response.content, 
                    content_type='application/zip'
                )
                django_response['Content-Disposition'] = f'attachment; filename="R-{comprobante.comprobante_completo}.zip"'
                return django_response
            else:
                print(f"❌ Error del microservicio: {response.status_code}")
                return Response(
                    {'error': f'Archivo CDR no encontrado'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return Response(
                {'error': f'Error descargando CDR: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

###################################################################################
# VIEWSETS PARA VENTA_DETALLE
###################################################################################

class VentaDetalleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar detalles de venta (solo lectura)
    """
    permission_classes = [IsAuthenticated]
    queryset = VentaDetalle.objects.all().select_related('ventCod', 'prodCod')
    serializer_class = VentaDetalleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ventCod', 'prodCod', 'ventDetAnulado']

    def get_queryset(self):
        """Personalizar queryset según permisos"""
        queryset = super().get_queryset()
        
        # Filtrar por sucursal del usuario
        user = self.request.user
        if hasattr(user, 'sucurCod') and user.sucurCod:
            queryset = queryset.filter(ventCod__sucurCod=user.sucurCod)
        
        return queryset

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
import re
import json

def reparar_json_malformado(texto):
    """
    Repara JSON malformado que devuelve RENIEC para algunos DNIs.
    Ejemplo: "nombre"VALOR"campo"VALOR -> {"nombre":"VALOR","campo":"VALOR"}
    """
    try:
        # Intentar parseo normal primero
        return json.loads(texto)
    except json.JSONDecodeError:
        # Extraer campos con regex
        campos = {}
        
        # Patrón: "campo"valor (donde valor puede tener espacios)
        patron = r'"([^"]+)"([^"]*?)(?="[a-zA-Z]|$)'
        matches = re.finditer(patron, texto)
        
        for match in matches:
            campo = match.group(1)
            valor = match.group(2).strip()
            campos[campo] = valor
        
        return campos

@csrf_exempt
@require_http_methods(["GET", "OPTIONS"])
def consultar_dni_reniec(request):
    """Proxy para consultar DNI en RENIEC"""
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    dni = request.GET.get('numero')
    
    if not dni or len(dni) != 8 or not dni.isdigit():
        return JsonResponse({'error': 'DNI inválido'}, status=400)
    
    # Verificar caché
    cache_key = f'reniec_dni_{dni}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return JsonResponse(cached_data, safe=False)
    
    try:
        response = requests.get(
            f'https://api.apis.net.pe/v1/dni?numero={dni}',
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Referer': 'https://api.apis.net.pe/',
            },
            timeout=15,
            verify=True
        )
        
        if response.status_code != 200:
            return JsonResponse({'error': 'DNI no encontrado en RENIEC'}, status=404)
        
        response_text = response.text
        
        # Verificar si es "echo" error
        if response_text.strip().startswith('echo'):
            return JsonResponse({'error': 'DNI no encontrado en RENIEC'}, status=404)
        
        # Parsear respuesta (maneja JSON malformado)
        data = reparar_json_malformado(response_text)
        
        # Normalizar campos
        resultado = {
            'numeroDocumento': data.get('numeroDocumento') or data.get('numero') or dni,
            'nombres': data.get('nombres', ''),
            'apellidoPaterno': data.get('apellidoPaterno', ''),
            'apellidoMaterno': data.get('apellidoMaterno', ''),
            'nombre': data.get('nombre', ''),
        }
        
        # Cachear por 24 horas
        cache.set(cache_key, resultado, 86400)
        
        return JsonResponse(resultado, safe=False)
        
    except requests.exceptions.Timeout:
        return JsonResponse({'error': 'Tiempo de espera agotado'}, status=504)
        
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': 'Error de conexión con RENIEC'}, status=500)
        
    except Exception as e:
        return JsonResponse({'error': 'Error interno del servidor'}, status=500)