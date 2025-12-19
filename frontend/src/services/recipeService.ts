// services/recipeService.ts
import api from "../auth/services/api";
import type { Recipe } from "../types/recipe";

class RecipeService {
  private endpoint = "/recipes";

  async getAll(params?: any): Promise<Recipe[]> {
    const response = await api.get(`${this.endpoint}/`, { params });
    return response.data.results ?? response.data;
  }

  async getById(id: number): Promise<Recipe> {
    const response = await api.get(`${this.endpoint}/${id}/`);
    return response.data;
  }

  async create(data: Recipe): Promise<Recipe> {
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
