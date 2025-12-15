import requests
import json
from django.conf import settings
from decimal import Decimal
import base64
from datetime import datetime

class SunatClient:
    def __init__(self):
        self.base_url = getattr(settings, 'SUNAT_SERVICE_URL', 'http://localhost:8001')
        self.timeout = getattr(settings, 'SUNAT_TIMEOUT', 30)
    
    def enviar_comprobante(self, comprobante):
        """
        Envía comprobante a SUNAT a través del microservicio PHP
        """
        try:
            # Preparar datos para el microservicio PHP
            sunat_data = self._preparar_datos_sunat(comprobante)
            
            print(f"📤 Enviando comprobante {comprobante.comprobante_completo} a SUNAT...")
            print(f"📊 Datos: {json.dumps(sunat_data, indent=2)}")
            
            # Cambia la URL del endpoint
            response = requests.post(
                f"{self.base_url}/boleta",  # ← CAMBIADO de /api/comprobantes/enviar a /boleta
                json=sunat_data,
                headers={'Content-Type': 'application/json'},
                timeout=self.timeout
            )
            
            print(f"📥 Respuesta SUNAT: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                resultado = response.json()
                return self._procesar_respuesta_sunat(comprobante, resultado)
            else:
                error_msg = f"Error HTTP {response.status_code}: {response.text}"
                print(f"❌ {error_msg}")
                raise Exception(error_msg)
                
        except requests.exceptions.Timeout:
            error_msg = "Timeout al conectar con servicio SUNAT"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
        except requests.exceptions.ConnectionError:
            error_msg = "No se pudo conectar al servicio SUNAT"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
        except requests.exceptions.RequestException as e:
            error_msg = f"Error de conexión: {str(e)}"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Error inesperado: {str(e)}"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
    
    def _preparar_datos_sunat(self, comprobante):
        """
        Prepara los datos en el formato esperado por el microservicio PHP
        """
        venta = comprobante.ventCod
        
        # Obtener detalles del comprobante
        detalles_comprobante = comprobante.detalles.all()
        
        items = []
        for detalle in detalles_comprobante:
            item = {
                'codigo': detalle.prodCod.prodCod if detalle.prodCod else 'P001',
                'descripcion': detalle.comprDetDescripcion[:250],
                'cantidad': float(detalle.comprDetCantidad),
                'valor_unitario': float(detalle.comprDetValorUni),
                'unidad_medida': 'NIU'
            }
            items.append(item)
        
        # CORREGIDO: Usar strftime con formato correcto
        sunat_data = {
            'serie': comprobante.comprSerie,
            'correlativo': str(comprobante.comprCorrelativo),
            'fecha_emision': comprobante.comprFechaEmision.strftime('%Y-%m-%d'),  # ← CAMBIADO
            'cliente': {
                'tipo_doc': comprobante.comprTipoDocReceptor,
                'num_doc': comprobante.comprNumDocReceptor,
                'rzn_social': comprobante.comprRazonSocialReceptor[:100]
            },
            'items': items
        }
        
        print(f"📋 Datos preparados para SUNAT: {json.dumps(sunat_data, indent=2)}")
        return sunat_data
    
    def _convertir_tipo_afectacion(self, tipo_igv):
        """
        Convierte el tipo de afectación IGV al formato SUNAT
        """
        conversion = {
            '10': '10',  # Gravado - Operación Onerosa
            '20': '20',  # Exonerado - Operación Onerosa
            '30': '30',  # Inafecto - Operación Onerosa
            '31': '31',  # Gratuita
            '40': '40',  # Exportación
        }
        return conversion.get(tipo_igv, '10')  # Por defecto gravado
    
    def _procesar_respuesta_sunat(self, comprobante, respuesta):
        """
        Procesa la respuesta del servicio SUNAT
        """
        print(f"📋 Procesando respuesta SUNAT: {respuesta}")
        
        # Tu servicio PHP ahora retorna 'success' y 'estado'
        if respuesta.get('success') == True or respuesta.get('estado') == 'ACEPTADO':
            # Comprobante aceptado por SUNAT
            return {
                'estado': 'ACEPTADO',
                'mensaje': respuesta.get('descripcion', 'Comprobante aceptado por SUNAT'),
                'codigo_respuesta': respuesta.get('codigo', '0'),
                'hash': respuesta.get('hash', ''),
                'cdr_nombre': respuesta.get('nombre_cdr_zip', ''),
                'cdr_base64': respuesta.get('cdr_base64', ''),
                'xml_base64': respuesta.get('xml_base64', ''),
                'enlace_xml': respuesta.get('enlace_xml', ''),
                'enlace_cdr': respuesta.get('enlace_cdr', ''),
            }
        else:
            # Comprobante rechazado
            return {
                'estado': 'RECHAZADO',
                'mensaje': respuesta.get('error', 'Error desconocido en SUNAT'),
                'codigo_respuesta': 'ERROR',
                'hash': '',
                'cdr_nombre': '',
                'cdr_base64': '',
                'xml_base64': '',
                'enlace_xml': '',
                'enlace_cdr': '',
            }
    
    def consultar_ticket(self, ticket_numero):
        """
        Consulta el estado de un ticket en SUNAT
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/comprobantes/consultar/{ticket_numero}",
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Error al consultar ticket: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"Error consultando ticket: {str(e)}")
    
    def descargar_cdr(self, comprobante):
        """
        Descarga el CDR de SUNAT
        """
        try:
            if not comprobante.comprNombreCDR:
                raise Exception("No hay CDR asociado a este comprobante")
            
            response = requests.get(
                f"{self.base_url}/cdr/{comprobante.comprNombreCDR}",  # ← CAMBIADO
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.content
            else:
                raise Exception(f"Error al descargar CDR: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"Error descargando CDR: {str(e)}")
    
    def verificar_estado_servicio(self):
        """
        Verifica si el servicio SUNAT está disponible
        """
        try:
            print(f"🔍 Verificando servicio SUNAT en: {self.base_url}")
            
            # Cambia /api/health por /health
            response = requests.get(
                f"{self.base_url}/health",  # ← CAMBIADO
                timeout=10
            )
            
            print(f"📡 Respuesta del servicio: {response.status_code} - {response.text}")
            
            # Verificar que la respuesta sea 200 y contenga un indicador de salud
            if response.status_code == 200:
                try:
                    data = response.json()
                    return data.get('status') == 'OK' or data.get('status') == 'ok'
                except:
                    # Si no es JSON, pero responde 200, asumimos que está bien
                    return True
            return False
            
        except requests.exceptions.ConnectionError as e:
            print(f"❌ Error de conexión: {e}")
            return False
        except requests.exceptions.Timeout as e:
            print(f"⏰ Timeout: {e}")
            return False
        except Exception as e:
            print(f"⚠️ Error inesperado: {e}")
            return False
    
    def obtener_resumen_diario(self, fecha, comprobantes):
        """
        Genera resumen diario de boletas
        """
        try:
            datos_resumen = {
                'fecha': fecha.strftime('%Y-%m-%d'),
                'comprobantes': []
            }
            
            for comp in comprobantes:
                datos_resumen['comprobantes'].append({
                    'serie': comp.comprSerie,
                    'numero': comp.comprCorrelativo,
                    'total': float(comp.comprTotalVenta),
                    'cliente_ruc': comp.comprNumDocReceptor,
                })
            
            response = requests.post(
                f"{self.base_url}/api/resumen-diario",
                json=datos_resumen,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Error generando resumen: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"Error en resumen diario: {str(e)}")