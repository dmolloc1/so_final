import api from "../auth/services/api";
import type { Cash, CashOpening, } from "../types/cash";
import type { Branch } from "../types/branch";
export interface CloseCashRequest {
  cajaAperMontCierre: number;
  cajaAperObservacio: string;
}


export const getCashes = async (): Promise<Cash[]> => {
  const response = await api.get<Cash[]>('/cash/');
  return response.data;
};

export const createCash = async (cashData: Omit<Cash, 'cajCod'>): Promise<Cash> => {
  const response = await api.post<Cash>('/cash/', cashData);
  return response.data;
}  
export const updateCash = async (cajCod: number, cashData: Partial<Cash>): Promise<Cash> => {
  const response = await api.put<Cash>(`/cash/${cajCod}/`, cashData);
  return response.data;
}
export const getCashOpeningsByCash = async (cajCod: number): Promise<CashOpening[]> => {
  const response = await api.get<CashOpening[]>(`/cash/opening/by-cash/${cajCod}/`);
  return response.data;
}
//Inicia una apertura
export const createCashOpening = async (apertureData: Omit<CashOpening, 'cajAperCod'>): Promise<CashOpening> => {
  const response = await api.post<CashOpening>('/cash/opening/', apertureData);
  return response.data;
} 

export const updateCashOpening = async (cajAperCod: number, apertureData: Partial<CashOpening>): Promise<CashOpening> => {
  const response = await api.put<CashOpening>(`/cash/opening/${cajAperCod}/`, apertureData);
  return response.data;
}

export const closeCashOpening = async (
  closureData: CloseCashRequest
): Promise<{ detail: string }> => {
  const response = await api.post<{ detail: string }>(
    '/cash/opening/close/', 
    closureData
  );
  return response.data;
};

export const deleteCash = async (cajCod: number): Promise<void> => {
  await api.delete<Cash>(`/cash/${cajCod}/`);
}
//Recupera el actual apertura abierta para el usuario (si es cajero) o para la sucursal (si no es cajero)
export const getOpenCash = async (): Promise<CashOpening | null> => {
  const response = await api.get<CashOpening | null>('/cash/opening/open/');
  return response.data;
}

export interface CashSessionSales {
  total_ventas: number;
  cantidad_ventas: number;
  ventas_por_forma_pago: {
    EFECTIVO: number;
    TARJETA: number;
    TRANSFERENCIA: number;
    YAPE: number;
    PLIN: number;
    MIXTO: number;
  };
}

// Obtener resumen de ventas de la sesión actual
export const getCashSessionSales = async (): Promise<CashSessionSales> => {
  const response = await api.get<CashSessionSales>('/cash/opening/session_sales/');
  return response.data;
};