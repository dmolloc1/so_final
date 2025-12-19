import api from './api';
import type { User, TokenResponse } from '../types/user';

export const getToken = async (usuNom: string, password: string): Promise<TokenResponse> => {
  try{
    const response = await api.post<TokenResponse>('/user/token/', { usuNom, password });
    // IMPORTANTE: Guardar los tokens inmediatamente
    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      console.log('Tokens guardados en localStorage'); // Para debug
    }

    return response.data;
  }
  catch(error){
    console.log('Error Al obtener token', error)
    throw error;
  }
  
};

export const getSellers = async (): Promise<any> => {
  const response = await api.get('/user/sellers/');
  return response.data;
};

export const refreshToken = async (refresh: string): Promise<{ access: string }> => {
  const response = await api.post<{ access: string }>('/user/token/refresh/', { refresh });
  return response.data;
};


export const listUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/user/');
  return response.data;
};


export const getUser = async (usuCod: number): Promise<User> => {
  const response = await api.get<User>(`/user/get/${usuCod}/`);
  return response.data;
};


export const createUser = async (userData: Omit<User, 'usuCod'>): Promise<User> => {
  const payload = {
    ...userData,
    usuContra: userData.password,              // mapear password → usuContra
    usuNombreCom: userData.usuNombreCom,           //  mapear usuNombreCom → usuApell
    roles: userData.roles.map(r => r.rolCod!), // convertir Role[] → [id]
    sucurCod: userData.sucurCod,
  };

  console.log("Request JSON (createUser):", JSON.stringify(payload, null, 2));

  const response = await api.post<User>('/user/new/', payload);
  return response.data;
};

export const updateUser = async (usuCod: number, userData: Partial<User>): Promise<User> => {
  const payload = {
    ...userData,
    usuContra: userData.password,
    usuNombreCom: userData.usuNombreCom,
    sucurCod: userData.sucurCod,
    roles: userData.roles
  ? userData.roles
      .filter(r => r && r.rolCod !== undefined)
      .map(r => r.rolCod!)
  : undefined,
  };

  console.log("Request JSON (updateUser):", JSON.stringify(payload, null, 2));

  const response = await api.put<User>(`/user/update/${usuCod}/`, payload);
  return response.data;
};


export const deleteUser = async (usuCod: number): Promise<void> => {
  await api.delete(`/user/delete/${usuCod}/`);
};


export const changePassword = async (
  usuCod: number,
  old_password: string,
  new_password: string
): Promise<void> => {
  await api.put(`/user/change-password/${usuCod}/`, { old_password, new_password });
};

export const getCurrentUser = async (): Promise<User> => { //Agregamos guardado en el localStorage cuando lo usemos
  const response = await api.get<User>('/user/current-user/');
  return response.data;
};
//Aca quieor crear el userManager para reutilizarlo en lo que lo use 
export const checkIfManager = async () =>{
    try{
      const currentUser = await getCurrentUser();
      const manager = currentUser.roles?.some((role: { rolNivel: number }) => role.rolNivel === 0) ?? false;
      return manager;
    }
    catch(error){
      console.log("Error al verificar si es gerente u no", error);
      return false;
    }
};

export const cashierUsers = async(): Promise<User[]> => {
  const response = await api.get<User[]>(`user/list/cashier/`);
  return response.data
};
