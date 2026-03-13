import { api } from './api';

export interface ExampleItem {
  id: string;
  name: string;
  description?: string;
}

export const exampleService = {
  async getItems(): Promise<ExampleItem[]> {
    return api.get<ExampleItem[]>('/items');
  },

  async getItemById(id: string): Promise<ExampleItem> {
    return api.get<ExampleItem>(`/items/${id}`);
  },

  async createItem(data: Omit<ExampleItem, 'id'>): Promise<ExampleItem> {
    return api.post<ExampleItem>('/items', data);
  },

  async updateItem(id: string, data: Partial<ExampleItem>): Promise<ExampleItem> {
    return api.put<ExampleItem>(`/items/${id}`, data);
  },

  async deleteItem(id: string): Promise<void> {
    return api.delete<void>(`/items/${id}`);
  },
};
