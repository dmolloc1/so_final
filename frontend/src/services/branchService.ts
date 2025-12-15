import api from '../auth/services/api';
import type { Branch } from '../types/branch'; //import type version moderna ts

// Obtener todas las sucursales
export const getBranches = async (): Promise<Branch[]> => { //promise predice lo que devuelve
  const response = await api.get<Branch[]>('/branch/');
  return response.data;
};

// Obtener una sucursal por código
export const getBranch = async (sucurCod: string): Promise<Branch> => {
  const response = await api.get<Branch>(`/branch/get/${sucurCod}/`);
  return response.data;
};

// Crear nueva sucursal
export const createBranch = async (branchData: Omit<Branch, 'sucurCod'>): Promise<Branch> => {
  const response = await api.post<Branch>('/branch/new/', branchData);
  return response.data;
};

// Actualizar sucursal existente
export const updateBranch = async (sucurCod: string, branchData: Partial<Branch>): Promise<Branch> => {
  const response = await api.put<Branch>(`/branch/update/${sucurCod}/`, branchData);
  return response.data;
};
export const deleteBranch = async (sucurCod: string): Promise<void> => {
  await api.delete(`/branch/delete/${sucurCod}/`);
};