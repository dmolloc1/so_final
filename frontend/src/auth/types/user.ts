// Opciones de Roles
export type RolNombre =
  | 'GERENTE'
  | 'CAJERO'
  | 'VENDEDOR'
  | 'OPTOMETRA'
  | 'SUPERVISOR'
  | 'LOGISTICA';

export type RolEstado = 'ACTIVO' | 'DESACTIVADO' | 'SUSPENDIDO';

export type RolNivel = 0 | 1 | 2 | 3 | 4;

export interface Role {
  rolCod?: number;
  rolNom: RolNombre;
  rolDes: string;
  rolEstado: RolEstado;
  rolNivel: RolNivel;
}

// Opciones de Usuario
export interface User {
  usuCod?: number;
  usuNom: string;
  password: string;
  usuNombreCom: string;
  usuDNI: string;
  usuTel: string;
  usuEmail: string;
  usuEstado: boolean;
  roles: Role[]; // ManyToMany  arreglo de roles
  sucurCod?: number;  //Puede ser null
  sucursal?: {      
    sucurCod: number;
    sucurNom: string;
  };
}

export interface TokenResponse {
  access: string;
  refresh: string;
}