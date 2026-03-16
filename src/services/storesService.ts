import { api } from './api';

export interface StoreItem {
  id: string;
  price: number;
  active: boolean;
  itemId: string;
  storeId: string;
  item: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    categoryId: string;
  };
}

export interface Store {
  id: string;
  name: string;
  chainName: string;
  city: string | null;
  country: string | null;
  storeItems: StoreItem[];
  storeCategories: Array<{
    id: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
      items: Array<{
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
      }>;
    };
  }>;
  _count: {
    orders: number;
    storeItems: number;
    storeCategories: number;
  };
}

export const storesService = {
  /**
   * GET /api/stores
   * Listar tiendas del usuario
   */
  list: async (): Promise<{ stores: Store[]; count: number }> => {
    const response = await api.get('/stores');
    return response as { stores: Store[]; count: number };
  },

  /**
   * GET /api/stores/:id
   * Obtener detalle de una tienda con items y categorías
   */
  getById: async (storeId: string): Promise<{ store: Store }> => {
    const response = await api.get(`/stores/${storeId}`);
    return response as { store: Store };
  },
};
