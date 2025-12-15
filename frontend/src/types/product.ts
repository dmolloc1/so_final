export interface Product {
  prodCod: number;
  prodBarcode: string;
  prodDescr: string;
  prodMarca: string;
  prodMate: string;
  prodPublico: 'ADULTO' | 'JOVEN' | 'NIÑO' | 'BEBE' | 'UNISEX' | 'TODOS';
  prodCostoInv: string | number;
  prodValorUni: string | number;
  prodTipoAfecIGV: '10' | '20' | '30' | '40';
  prodUnidadMedi: 'NIU' | 'ZZ' | 'BX' | 'PK' | 'SET' | 'PR' | 'DZN';
  prodOrigin: 'GLOBAL' | 'LOCAL';
  prodEstado: 'Active' | 'Inactive';
  branchOwner: number | null;
  catproCod: number;
  provCod: number;
  
  precioVentaConIGV: number;
  margenGanancia: number;
  montoIGV: number;
  is_active: boolean;
  
  sucursal_nombre: string | null;
  categoria_nombre: string;
  proveedor_nombre: string;
  total_stock_central?: number;
  
  stock_disponible?: number;
}

export interface CreateProductDTO {
  catproCod: number;
  provCod: number;
  prodDescr: string;
  prodMarca: string;
  prodMate: string;
  prodPublico: 'ADULTO' | 'JOVEN' | 'NIÑO';
  prodCostoInv: number;
  prodValorUni: number;
  prodTipoAfecIGV: string;
  prodUnidadMedi: string;
  invStock?: number;
  invStockMin?: number;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  prodEstado?: 'Active' | 'Inactive';
}

export interface BranchStock {
  id: number;
  sucurCod: number;
  prodCod: number;
  invStock: number;
  invStockMin: number;
  producto_id: number;
  producto_descripcion: string;
  producto_marca: string;
  producto_barcode: string;
  producto_origin: string;
  producto_branch_owner: number | null;
  sucursal_id: number;
  sucursal_nombre: string;
  valorTotalStock: number;
  is_low_stock: boolean;
  necesitaReposicion: number;
}

export interface CentralStock {
  producto_id: number;
  producto: string;
  marca: string;
  total_stock_central: number;
  barcode: string;
}

export interface DashboardSummary {
  productos_globales_total: number;
  productos_locales_por_sucursal: Array<{
    sucursal: string;
    productos_locales: number;
  }>;
  alertas_stock_bajo: BranchStock[];
}

export interface Inventory {
  id: number;
  sucurCod: number;
  prodCod: number;
  invStock: number;
  invStockMin: number;
  producto_id: number;
  producto_descripcion: string;
  producto_marca: string;
  producto_barcode: string;
  producto_origin: string;
  producto_branch_owner: number | null;
  sucursal_id: number;
  sucursal_nombre: string;
  valorTotalStock: number;
  is_low_stock: boolean;
  necesitaReposicion: number;
}