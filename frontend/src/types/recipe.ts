export interface Recipe {
  receCod?: number;
  receFech: string;

  receEsfeD: string;
  receCilinD: string;
  receEjeD: number;
  receEsfel: string;
  receCilinl: string;
  receEjel: number;

  receDistPupilar: string;
  receTipoLent: string;
  receObserva?: string;
  receRegistro?: string;
  receEstado: string;

  cliCod: number;
  

  usuCod: number | null;
  sucurCod: number;

  cliente_nombre?: string;
  cliente_documento?: string;
  cliente_tipo_doc?: string;
  optometra_nombre?: string;
  sucursal_nombre?: string;
}

export interface RecipeFilters {
  search?: string;
  receEstado?: string;
  receTipoLent?: string;
  sucurCod?: number;
}
