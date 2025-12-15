import api from '../auth/services/api';

// Interfaz para el Proveedor (debe coincidir con el backend)
export interface Supplier {
  provCod?: number;
  provRuc: string;
  provRazSocial: string;
  provDirec: string;
  provTele: string;
  provEmail: string;
  provCiu: string;
  provEstado: 'Active' | 'Inactive';
}

// Interfaz para la respuesta del servidor
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

// Parámetros de filtrado
export interface SupplierFilters {
  search?: string;
  prov_estado?: 'Active' | 'Inactive';
  prov_ciu?: string;
  ordering?: string;
}

class SupplierService {
  private endpoint = '/suppliers';

  /**
   * Obtener todos los proveedores con filtros opcionales (SIN PAGINACIÓN)
   */
  async getAll(filters?: SupplierFilters): Promise<Supplier[]> {
    try {
      const params = new URLSearchParams();
      
      // Agregar parámetro para desactivar paginación
      params.append('page_size', '1000'); // Obtener hasta 1000 registros
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.prov_estado) params.append('prov_estado', filters.prov_estado);
      if (filters?.prov_ciu) params.append('prov_ciu', filters.prov_ciu);
      if (filters?.ordering) params.append('ordering', filters.ordering);

      const url = `${this.endpoint}/?${params.toString()}`;
      console.log('Fetching from:', url);
      
      const response = await api.get(url);
      console.log('Response received:', response.data);
      
      // Si la respuesta tiene paginación, extraer solo los resultados
      if (response.data.results) {
        console.log(`Found ${response.data.results.length} suppliers`);
        return response.data.results;
      }
      
      // Si no hay paginación, devolver directamente
      console.log(`Found ${response.data.length} suppliers`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching suppliers:');
      console.error('Message:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('URL:', error.config?.url);
      console.error('Base URL:', error.config?.baseURL);
      throw error;
    }
  }

  /**
   * Obtener un proveedor por ID
   */
  async getById(id: number): Promise<Supplier> {
    try {
      console.log(`Fetching supplier with ID: ${id}`);
      const response = await api.get<ApiResponse<Supplier>>(`${this.endpoint}/${id}/`);
      
      if (response.data.data) {
        console.log('Supplier found:', response.data.data);
        return response.data.data;
      }
      
      // Si no viene en formato ApiResponse, devolver directamente
      if (response.data) {
        console.log('upplier found:', response.data);
        return response.data as unknown as Supplier;
      }
      
      throw new Error('Supplier not found');
    } catch (error: any) {
      console.error(`Error fetching supplier ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear un nuevo proveedor
   */
  async create(supplier: Omit<Supplier, 'prov_cod' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    try {
      console.log('Creating supplier:', supplier);
      const response = await api.post<ApiResponse<Supplier>>(this.endpoint + '/', supplier);
      
      if (response.data.success && response.data.data) {
        console.log('Supplier created successfully:', response.data.data);
        return response.data.data;
      }
      
      // Si no viene en formato ApiResponse, devolver directamente
      if (response.data) {
        console.log('Supplier created:', response.data);
        return response.data as unknown as Supplier;
      }
      
      const apiResponse = response.data as ApiResponse<Supplier>;
      throw new Error(apiResponse.message || 'Error creating supplier');


    } catch (error: any) {
      console.error('Error creating supplier:');
      console.error('  Response:', error.response?.data);
      if (error.response?.data?.errors) {
        throw error.response.data.errors;
      }
      throw error;
    }
  }

  /**
   * Actualizar un proveedor existente
   */
  async update(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      console.log(`Updating supplier ${id}:`, supplier);
      const response = await api.patch<ApiResponse<Supplier>>(`${this.endpoint}/${id}/`, supplier);
      
      if (response.data.success && response.data.data) {
        console.log('Supplier updated successfully:', response.data.data);
        return response.data.data;
      }
      
      // Si no viene en formato ApiResponse, devolver directamente
      if (response.data) {
        console.log('Supplier updated:', response.data);
        return response.data as unknown as Supplier;
      }
      
      
      const apiResponse = response.data as ApiResponse<Supplier>;
      throw new Error(apiResponse.message || 'Error creating supplier');
    } catch (error: any) {
      console.error(`Error updating supplier ${id}:`, error.response?.data);
      if (error.response?.data?.errors) {
        throw error.response.data.errors;
      }
      throw error;
    }
  }

  /**
   * Eliminar un proveedor
   */
  async delete(id: number): Promise<void> {
    try {
      console.log(`Deleting supplier ${id}`);
      await api.delete(`${this.endpoint}/${id}/`);
      console.log(`Supplier ${id} deleted successfully`);
    } catch (error: any) {
      console.error(`Error deleting supplier ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener solo proveedores activos
   */
  async getActive(): Promise<Supplier[]> {
    try {
      console.log('Fetching active suppliers');
      const response = await api.get<ApiResponse<Supplier[]>>(`${this.endpoint}/active/`);
      
      const data = response.data.data || response.data;
      console.log(`Found ${Array.isArray(data) ? data.length : 0} active suppliers`);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error fetching active suppliers:', error);
      throw error;
    }
  }

  /**
   * Obtener solo proveedores inactivos
   */
  async getInactive(): Promise<Supplier[]> {
    try {
      console.log('Fetching inactive suppliers');
      const response = await api.get<ApiResponse<Supplier[]>>(`${this.endpoint}/inactive/`);
      
      const data = response.data.data || response.data;
      console.log(`Found ${Array.isArray(data) ? data.length : 0} inactive suppliers`);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error fetching inactive suppliers:', error);
      throw error;
    }
  }

  /**
   * Cambiar el estado de un proveedor
   */
  async changeStatus(id: number, status: 'Active' | 'Inactive'): Promise<Supplier> {
    try {
      console.log(`Changing status of supplier ${id} to ${status}`);
      const response = await api.patch<ApiResponse<Supplier>>(
        `${this.endpoint}/${id}/change_status/`,
        { status }
      );
      
      if (response.data.success && response.data.data) {
        console.log('Status changed successfully');
        return response.data.data;
      }
      
      if (response.data) {
        return response.data as unknown as Supplier;
      }
      
      const apiResponse = response.data as ApiResponse<Supplier>;
      throw new Error(apiResponse.message || 'Error creating supplier');
    } catch (error: any) {
      console.error(`Error changing status for supplier ${id}:`, error);
      throw error;
    }
  }

  /**
   * Alternar el estado de un proveedor (Active <-> Inactive)
   */
  async toggleStatus(id: number): Promise<Supplier> {
    try {
      console.log(`Toggling status of supplier ${id}`);
      const response = await api.patch<ApiResponse<Supplier>>(
        `${this.endpoint}/${id}/toggle_status/`
      );
      
      if (response.data.success && response.data.data) {
        console.log('Status toggled successfully');
        return response.data.data;
      }
      
      if (response.data) {
        return response.data as unknown as Supplier;
      }
      
      const apiResponse = response.data as ApiResponse<Supplier>;
      throw new Error(apiResponse.message || 'Error creating supplier');
    } catch (error: any) {
      console.error(`Error toggling status for supplier ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de proveedores
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    active_percentage: number;
  }> {
    try {
      console.log('Fetching supplier statistics');
      const response = await api.get<ApiResponse<any>>(`${this.endpoint}/stats/`);
      console.log('Statistics received:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching supplier stats:', error);
      throw error;
    }
  }
}

// Exportar instancia única del servicio
export default new SupplierService();