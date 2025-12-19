// services/recipe.ts

export interface Recipe {
  recCod?: number;
  recFecha?: string;

  recTipoLente: string;
  recEstado?: string;
  recObservaciones?: string;

  dpGeneral?: number | null;

  // Lejos OD
  lejos_od_esf?: number | null;
  lejos_od_cil?: number | null;
  lejos_od_eje?: number | null;
  lejos_od_avcc?: number | null;
  lejos_od_dip?: number | null;

  // Lejos OI
  lejos_oi_esf?: number | null;
  lejos_oi_cil?: number | null;
  lejos_oi_eje?: number | null;
  lejos_oi_avcc?: number | null;
  lejos_oi_dip?: number | null;

  // Cerca OD
  cerca_od_esf?: number | null;
  cerca_od_cil?: number | null;
  cerca_od_eje?: number | null;
  cerca_od_add?: number | null;

  // Cerca OI
  cerca_oi_esf?: number | null;
  cerca_oi_cil?: number | null;
  cerca_oi_eje?: number | null;
  cerca_oi_add?: number | null;

  diagnostico?: any[];

  // Relaciones (ids)
  cliente: number;
  optometra?: number;
  sucurCod?: number;

  // Campos calculados (solo lectura)
  cliente_nombre?: string;
  cliente_documento?: string;
  cliente_tipo_doc?: string;
  optometra_nombre?: string;
  sucursal_nombre?: string;
}
