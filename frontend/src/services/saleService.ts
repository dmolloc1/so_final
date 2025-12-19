import api from "../auth/services/api";
import type { VentaResponse, CreateVentaRequest, RegistrarPagoRequest, RegistrarPagoResponse, AnularVentaRequest, ReporteVentasParams } from "../types/sale";

class SaleService {
    private basePath = '/sales';
  
    // Crear nueva venta
    async createVenta(data: CreateVentaRequest): Promise<VentaResponse> {
      const response = await api.post(`${this.basePath}/ventas/`, data);
      return response.data;
    }
  
    // Obtener todas las ventas
    async getVentas(params?: {
      search?: string;
      estado?: string;
      estado_recojo?: string;
      fecha_desde?: string;
      fecha_hasta?: string;
      sucursal?: number;
      vendedor?: number;
      cliente?: string;
    }): Promise<VentaResponse[]> {
      const response = await api.get(`${this.basePath}/ventas/`, { params });
      return response.data;
    }
  
    // Obtener detalle de una venta
    async getVentaById(ventCod: number): Promise<VentaResponse> {
      const response = await api.get(`${this.basePath}/ventas/${ventCod}/`);
      return response.data;
    }
  
    // Actualizar venta (PATCH)
    async updateVenta(
      ventCod: number, 
      data: Partial<CreateVentaRequest>
    ): Promise<VentaResponse> {
      const response = await api.patch(`${this.basePath}/ventas/${ventCod}/`, data);
      return response.data;
    }
  
    // Registrar pago
    async registrarPago(
      ventCod: number, 
      data: RegistrarPagoRequest
    ): Promise<RegistrarPagoResponse> {
      const response = await api.post(
        `${this.basePath}/ventas/${ventCod}/registrar_pago/`, 
        data
      );
      return response.data;
    }
  
    // Anular venta
    async anularVenta(ventCod: number, data: AnularVentaRequest): Promise<{ mensaje: string }> {
      const response = await api.post(
        `${this.basePath}/ventas/${ventCod}/anular/`, 
        data
      );
      return response.data;
    }
  
    // Enviar a laboratorio
    async enviarLaboratorio(ventCod: number): Promise<{ mensaje: string }> {
      const response = await api.post(
        `${this.basePath}/ventas/${ventCod}/enviar_laboratorio/`
      );
      return response.data;
    }
  
    // Marcar como listo para recoger
    async marcarListo(ventCod: number): Promise<{ mensaje: string }> {
      const response = await api.post(
        `${this.basePath}/ventas/${ventCod}/marcar_listo/`
      );
      return response.data;
    }
  
    // Marcar como entregado
    async marcarEntregado(ventCod: number): Promise<{ mensaje: string }> {
      const response = await api.post(
        `${this.basePath}/ventas/${ventCod}/marcar_entregado/`
      );
      return response.data;
    }
  
    // Obtener reportes
    async getReportes(params?: ReporteVentasParams): Promise<any> {
      const response = await api.get(`${this.basePath}/ventas/reportes/`, { params });
      return response.data;
    }
  
    // Obtener estadísticas
    async getEstadisticas(params?: ReporteVentasParams): Promise<any> {
      const response = await api.get(`${this.basePath}/ventas/estadisticas/`, { params });
      return response.data;
    }
  
    // Obtener detalles de venta
    async getVentaDetalles(ventCod: number): Promise<any[]> {
      const response = await api.get(`${this.basePath}/ventas-detalles/`, { 
        params: { ventCod }
      });
      return response.data;
    }

    // Enviar a SUNAT
    async enviarASunat(comproCod: number): Promise<{ mensaje: string }> {
      const response = await api.post(
        `${this.basePath}/comprobantes/${comproCod}/enviar_sunat/`
      );
      return response.data;
    }

    // Obtener comprobante por ID de venta (nuevo método)
    async getComprobanteByVentaId(ventCod: number): Promise<any> {
      const response = await api.get(`${this.basePath}/comprobantes/`, {
        params: { venta_codigo: ventCod }
      });
      // Asumiendo que retorna un array, tomamos el primero
      return response.data[0] || null;
    }

    // Descargar PDF
    async descargarPDF(comproCod: number): Promise<Blob> {
      const response = await api.get(
        `${this.basePath}/comprobantes/${comproCod}/descargar_pdf/`,
        {
          responseType: 'blob' // Importante para archivos
        }
      );
      return response.data;
    }

    // Descargar XML
    async descargarXML(comproCod: number): Promise<Blob> {
      const response = await api.get(
        `${this.basePath}/comprobantes/${comproCod}/descargar_xml/`,
        {
          responseType: 'blob'
        }
      );
      return response.data;
    }

    // Descargar CDR
    async descargarCDR(comproCod: number): Promise<Blob> {
      const response = await api.get(
        `${this.basePath}/comprobantes/${comproCod}/descargar_cdr/`,
        {
          responseType: 'blob'
        }
      );
      return response.data;
    }

  }
  
  export const saleService = new SaleService();