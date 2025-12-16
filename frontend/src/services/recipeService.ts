import type { Recipe, RecipeFilters } from '../types/recipe';
import api from "../auth/services/api";

export const recipeService = {
  async getAll(filters?: RecipeFilters): Promise<Recipe[]> {
    const response = await api.get('/recipes/', { params: filters });
    const payload = response.data;

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;

    return [];
  },

  async getById(id: number): Promise<Recipe> {
    const response = await api.get(`/recipes/${id}/`);
    return response.data?.data || response.data;
  },

  async create(recipe: Omit<Recipe, 'receCod'>): Promise<Recipe> {
    const response = await api.post('/recipes/', recipe);
    return response.data?.data || response.data;
  },

  async update(id: number, recipe: Partial<Recipe>): Promise<Recipe> {
    const response = await api.put(`/recipes/${id}/`, recipe);
    return response.data?.data || response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/recipes/${id}/`);
  },


};

export default recipeService;