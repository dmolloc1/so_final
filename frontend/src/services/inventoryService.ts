import api from "../auth/services/api";
import type  { Product, CreateProductDTO, UpdateProductDTO, BranchStock, CentralStock, DashboardSummary, Inventory } from "../types/product";


export const productService = {
  // Listar todos los productos
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/inventory/products/');
    return response.data;
  },

  getByBarcode: async (barcode: string): Promise<Product[]> => {
    const response = await api.get(`/inventory/products/?prodBarcode=${barcode}`);
    return response.data;
  },

  // Buscar por texto (nombre, marca, etc.)
  search: async (query: string): Promise<Product[]> => {
    const response = await api.get(`/inventory/products/?search=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Búsqueda general que decide automáticamente el método
  searchProducts: async (query: string): Promise<Product[]> => {
    if (/^\d+$/.test(query)) {
      return productService.getByBarcode(query);
    } else {
      return productService.search(query);
    }
  },

  // Obtener un producto por ID
  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/inventory/products/${id}/`);
    return response.data;
  },

  // Crear producto (GLOBAL para gerente, LOCAL para supervisor)
  create: async (data: CreateProductDTO): Promise<Product> => {
    const response = await api.post('/inventory/products/', data);
    return response.data;
  },

  // Actualizar producto
  update: async (id: number, data: UpdateProductDTO): Promise<Product> => {
    const response = await api.put(`/inventory/products/${id}/`, data);
    return response.data;
  },

  // Actualización parcial
  partialUpdate: async (id: number, data: Partial<UpdateProductDTO>): Promise<Product> => {
    const response = await api.patch(`/inventory/products/${id}/`, data);
    return response.data;
  },

  // Eliminar producto
  delete: async (id: number): Promise<void> => {
    await api.delete(`/inventory/products/${id}/`);
  },

  // Stock por sucursales de un producto
  getBranchStock: async (id: number): Promise<BranchStock[]> => {
    const response = await api.get(`/inventory/products/${id}/branch-stock/`);
    return response.data;
  },

  // Inventario central (solo productos globales)
  getCentralStock: async (): Promise<CentralStock[]> => {
    const response = await api.get('/inventory/products/central-stock/');
    return response.data;
  },

  // Productos locales (solo gerente)
  getLocalProducts: async (): Promise<any[]> => {
    const response = await api.get('/inventory/products/local-products/');
    return response.data;
  },

  // Regenerar código de barras
  regenerateBarcode: async (id: number): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await api.post(`/inventory/products/${id}/regenerate_barcode/`);
    return response.data;
  },

  // Dashboard gerente
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/inventory/products/dashboard-summary/');
    return response.data;
  },

  // Productos por sucursal
  getByBranch: async (branchId: number): Promise<any> => {
    const response = await api.get(`/inventory/products/by-branch/${branchId}/`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/inventory/categories/');
    return response.data;
  },

  deactivate: async (id: number): Promise<void> => {
    await api.post(`/inventory/products/${id}/deactivate/`);
  },
  
  activate: async (id: number): Promise<void> => {
    await api.post(`/inventory/products/${id}/activate/`);
  },
};

export const inventoryService = {
  // Listar inventarios
  getAll: async (): Promise<Inventory[]> => {
    const response = await api.get('/inventory/inventory/');
    return response.data;
  },

  // Crear inventario
  create: async (data: { sucurCod: number; prodCod: number; invStock: number; invStockMin: number }): Promise<Inventory> => {
    const response = await api.post('/inventory/inventory/', data);
    return response.data;
  },

  // Actualizar stock
  updateStock: async (id: number, invStock: number): Promise<{ success: boolean; data: Inventory }> => {
    const response = await api.patch(`/inventory/inventory/${id}/update-stock/`, { invStock });
    return response.data;
  },
};

// Exportar todo junto
export default {
  products: productService,
  inventory: inventoryService,
};