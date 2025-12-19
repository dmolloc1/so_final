export interface VentaDetalle {
  prodCod: number;
  prodNombre: string;
  ventDetCantidad: number;
  ventDetPrecioUnit: string;
  ventDetSubtotal: string;
}

export interface VentaDetalleItem {
  ventDetCod: number;
  ventCod: number;
  prodCod: number;
  producto_nombre?: string;
  producto_marca?: string;
  producto_codigo?: string;
  producto_unidadMed?: string;
  ventDetCantidad: number;
  ventDetValorUni: string;
  ventDetPrecioUni: string;
  ventDetSubtotal: string;
  ventDetIGV: string;
  ventDetTotal: string;
  ventDetDescuento: string;
  ventDetAnulado: boolean;
  ventDetDescripcion?: string;
  ventDetMarca?: string;
}

export interface ComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaData: any; // idealmente tipar con VentaResponse
  saleService?: any;
  sucursalData: any;
}