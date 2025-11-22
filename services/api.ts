
import { List, ListItem } from '../types';

// Safely check for import.meta.env (Vite specific) to avoid runtime errors in other environments
const isProduction = (import.meta as any).env?.MODE === 'production';
const API_URL = isProduction ? '' : 'http://localhost:3000';
const STORAGE_KEY = 'familist_offline_data';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('familist_token')}`
  };
};

// --- Offline Fallback Helpers ---
const getLocalData = (): { lists: List[], items: ListItem[] } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { lists: [], items: [] };
  } catch (e) {
    return { lists: [], items: [] };
  }
};

const saveLocalData = (data: { lists: List[], items: ListItem[] }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const api = {
  getData: async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      // Cache successful server data to local storage
      saveLocalData(data);
      return data;
    } catch (error) {
      console.warn("API unreachable, using offline data.");
      return getLocalData();
    }
  },

  createList: async (list: List) => {
    try {
      await fetch(`${API_URL}/api/lists`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(list)
      });
    } catch (e) {
      const data = getLocalData();
      data.lists.push(list);
      saveLocalData(data);
    }
  },

  deleteList: async (id: string) => {
    try {
      await fetch(`${API_URL}/api/lists/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (e) {
      const data = getLocalData();
      data.lists = data.lists.filter(l => l.id !== id);
      data.items = data.items.filter(i => i.listId !== id);
      saveLocalData(data);
    }
  },

  addItem: async (item: ListItem) => {
    try {
      await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(item)
      });
    } catch (e) {
      const data = getLocalData();
      data.items.unshift(item);
      saveLocalData(data);
    }
  },

  toggleItem: async (id: string, completed: boolean) => {
    try {
      await fetch(`${API_URL}/api/items/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ completed })
      });
    } catch (e) {
      const data = getLocalData();
      const item = data.items.find(i => i.id === id);
      if (item) item.completed = completed;
      saveLocalData(data);
    }
  },

  deleteItem: async (id: string) => {
    try {
      await fetch(`${API_URL}/api/items/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (e) {
      const data = getLocalData();
      data.items = data.items.filter(i => i.id !== id);
      saveLocalData(data);
    }
  },

  updateListOrder: async (listId: string, items: ListItem[]) => {
    try {
      await fetch(`${API_URL}/api/lists/${listId}/items`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ items })
      });
    } catch (e) {
      const data = getLocalData();
      // Remove old items for this list
      const otherItems = data.items.filter(i => i.listId !== listId);
      // Combine new sorted items with others
      data.items = [...items, ...otherItems];
      saveLocalData(data);
    }
  }
};
