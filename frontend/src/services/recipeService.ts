import api from "../auth/services/api";
import type { Recipe } from "../types/recipe";

interface RecipeFilters {
  sucurCod?: number | string;
  cliCod?: number | string;
  usuCod?: number | string;
  receTipoLent?: string;
  search?: string;
  ordering?: string;
}

class RecipeService {
  private endpoint = "/recipes";

  async getAll(filters?: RecipeFilters): Promise<Recipe[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`${this.endpoint}/`, { params });

    if (response.data?.results) return response.data.results;
    if (Array.isArray(response.data)) return response.data;
    return response.data?.data || [];
  }

  async getById(id: number): Promise<Recipe> {
    const response = await api.get(`${this.endpoint}/${id}/`);
    return response.data;
  }

  async create(data: Omit<Recipe, "receCod">): Promise<Recipe> {
    const response = await api.post(`${this.endpoint}/`, data);
    return response.data;
  }

  async update(id: number, data: Partial<Recipe>): Promise<Recipe> {
    const response = await api.put(`${this.endpoint}/${id}/`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.endpoint}/${id}/`);
  }
}

export const recipeService = new RecipeService();
