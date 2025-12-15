import api from "../auth/services/api";

export interface Client {
  cli_cod?: number;
  cli_tipo_doc: string;
  cli_dni: string;
  cli_nombre: string;
  cli_apellido: string;
  cli_direccion: string;
  cli_telefono: string;
  cli_email: string;
  cli_fecha_nac: string; 
}

export interface ClientFilters {
  search?: string;
  ordering?: string;
}

class ClientService {
  private endpoint = '/clients';

  async getAll(filters?: ClientFilters): Promise<Client[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.ordering) params.append('ordering', filters.ordering);

      const response = await api.get(`${this.endpoint}/`, { params });

      if (response.data.results) return response.data.results;
      if (response.data.data && Array.isArray(response.data.data)) return response.data.data;
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: number): Promise<Client> {
    const response = await api.get(`${this.endpoint}/${id}/`);
    return response.data.data || response.data;
  }

  async create(client: Client): Promise<Client> {
    const response = await api.post(`${this.endpoint}/`, client);
    return response.data.data || response.data;
  }

  async update(id: number, client: Partial<Client>): Promise<Client> {
    const response = await api.patch(`${this.endpoint}/${id}/`, client);
    return response.data.data || response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.endpoint}/${id}/`);
  }
}

export default new ClientService();