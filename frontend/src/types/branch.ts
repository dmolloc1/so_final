// Opciones de Departamento
export type DEPARTAMENTO_CHOICES =
  | 'AMAZONAS'
  | 'ANCASH'
  | 'APURIMAC'
  | 'AREQUIPA'
  | 'AYACUCHO'
  | 'CAJAMARCA'
  | 'CALLAO'
  | 'CUSCO'
  | 'HUANCAVELICA'
  | 'HUANUCO'
  | 'ICA'
  | 'JUNIN'
  | 'LA_LIBERTAD'
  | 'LAMBAYEQUE'
  | 'LIMA'
  | 'LORETO'
  | 'MADRE_DE_DIOS'
  | 'MOQUEGUA'
  | 'PASCO'
  | 'PIURA'
  | 'PUNO'
  | 'SAN_MARTIN'
  | 'TACNA'
  | 'TUMBES'
  | 'UCAYALI';

// Opciones de Estado
export type EstadoSucursal = 'Active' | 'Inactive';

// Interface Branch
export interface Branch {
  sucurCod?: number;
  sucurNom: string;
  sucurDep: DEPARTAMENTO_CHOICES;
  sucurCiu: string;
  sucurDis: string;
  sucurDir: string;
  sucurTel: string;
  sucurEstado: EstadoSucursal;
}