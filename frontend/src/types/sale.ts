  import type { Product } from "./product";

  export type TipoDocumento = 'DNI' | 'RUC' | 'CE';
  export type TipoComprobante = '03' | '01' | '07' | '08'; 
  export type EstadoSUNAT = 'PENDIENTE' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'ANULADO';
  export type TipoDocReceptor = '1' | '6' | '-'; 
  export type FormaPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'MIXTO';
  export type TipoTarjeta = 'DEBITO' | 'CREDITO' | '';

  export interface CartItem {
    product: Product;
    quantity: number;
    discount: number;
    subtotal: number;
    igv: number;
    total: number;
  }

  export interface Customer {
    cliCod: string;
    cliNombreCom: string;
    cliDocTipo: TipoDocumento;
    cliDocNum: string;
    cliDireccion?: string; 
  }

  export interface Vendor {
    id: number;
    name: string;
  }

  export type PaymentMethod = FormaPago;

  export interface SaleData {
    customer: Customer | null;
    paymentMethod: PaymentMethod;
    vendorId: number | null;
  }


  export interface VentaDetalle {
    prodCod: number;
    ventDetCantidad: number;
    ventDetDescuento: number;
  }

  export interface CreateVentaRequest {
    usuCod: number;
    sucurCod: number;
    cliNombreCom: string;
    cliDocTipo: 'DNI' | 'RUC' | 'CE';
    cliDocNum: string;
    cliDireccion?: string;
    ventFechaEntrega?: string;
    ventObservaciones?: string;
    ventFormaPago: string;
    ventReferenciaPago?: string;
    ventTarjetaTipo?: string;
    ventAdelanto?: number;
    detalles: VentaDetalle[];
  }

  export interface VentaResponse {
    ventCod: number;
    ventFecha: string;
    ventFechaEntrega: string;
    cliNombreCom: string;
    cliDocTipo: string;
    cliDocNum: string;
    cliDireccion: string;
    ventEstado: string;
    estado_display: string;
    ventEstadoRecoj: string;
    estado_recojo_display: string;
    ventAnulada: boolean;
    ventMotivoAnulacion: string;
    ventSubTotal: string;
    ventIGV: string;
    ventTotal: string;
    ventTotalGravada: string;
    ventTotalInafecta: string;
    ventTotalExonerada: string;
    ventTotalGratuita: string;
    ventAdelanto: string;
    ventSaldo: string;
    ventFormaPago: string;
    forma_pago_display: string;
    ventReferenciaPago: string;
    ventTarjetaTipo: string;
    tarjeta_tipo_display: string;
    ventObservaciones: string;
    usuCod: number;
    sucurCod: number;
    sucursal_nombre: string;
    cajaAperCod: number | null;
    comprobante: any;
  }

  export interface RegistrarPagoRequest {
    monto: number;
    forma_pago: string;
    referencia_pago?: string;
    tarjeta_tipo?: string;
  }

  export interface RegistrarPagoResponse {
    mensaje: string;
    saldo_actual: number;
    estado: string;
  }

  export interface AnularVentaRequest {
    motivo: string;
  }

  export interface ReporteVentasParams {
    fecha_inicio?: string;
    fecha_fin?: string;
    sucursal?: number;
    vendedor?: number;
  }

  export interface VentaDetalle {
    prodCod: number;
    ventDetCantidad: number;
    ventDetDescuento: number;
  }
