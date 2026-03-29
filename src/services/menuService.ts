import { api } from './api';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryName: string;
  categoryId: string;
  stores: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  storeCount: number;
  minPrice: number;
  maxPrice: number;
  itemOptionIds?: string[];  // IDs de las opciones que tiene este item
}

export interface CategoryStat {
  name: string;
  itemCount: number;
  avgPrice: number;
}

export interface MenuResponse {
  items: MenuItem[];
  categories: CategoryStat[];
  stats: {
    totalItems: number;
    totalCategories: number;
  };
}

export const menuService = {
  /**
   * GET /api/menu/items
   * Obtener items del menú con filtros
   */
  getItems: async (params?: {
    storeIds?: string[];
    categoryIds?: string[];
    search?: string;
  }): Promise<MenuResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.storeIds?.length) {
      queryParams.append('storeIds', params.storeIds.join(','));
    }
    if (params?.categoryIds?.length) {
      queryParams.append('categoryIds', params.categoryIds.join(','));
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const url = `/menu/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<MenuResponse>(url);
  },

  /**
   * GET /api/menu/categories
   * Obtener categorías con estadísticas
   */
  getCategories: async (): Promise<{ categories: CategoryStat[] }> => {
    return api.get('/menu/categories');
  },
};
