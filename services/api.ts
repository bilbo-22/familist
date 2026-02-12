
import { List, ListItem } from '../types';

// Safely check for import.meta.env (Vite specific) to avoid runtime errors in other environments
const isProduction = (import.meta as any).env?.MODE === 'production';
const API_URL = isProduction ? '' : 'http://localhost:3000';
const STORAGE_KEY = 'familist_offline_data';

type AppData = {
  lists: List[];
  items: ListItem[];
};

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('familist_token')}`
  };
}

function getLocalData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { lists: [], items: [] };
  } catch {
    return { lists: [], items: [] };
  }
}

function saveLocalData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function sendRequest(path: string, options: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: getHeaders()
  });
}

async function withOfflineFallback(
  request: () => Promise<void>,
  updateLocalData: (data: AppData) => void
) {
  try {
    await request();
  } catch {
    const data = getLocalData();
    updateLocalData(data);
    saveLocalData(data);
  }
}

export const api = {
  getData: async () => {
    try {
      const res = await sendRequest('/api/data', {});
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      saveLocalData(data);
      return data;
    } catch {
      console.warn("API unreachable, using offline data.");
      return getLocalData();
    }
  },

  createList: async (list: List) => {
    return withOfflineFallback(
      () => sendRequest('/api/lists', {
        method: 'POST',
        body: JSON.stringify(list)
      }).then(() => undefined),
      (data) => {
        data.lists.push(list);
      }
    );
  },

  deleteList: async (id: string) => {
    return withOfflineFallback(
      () => sendRequest(`/api/lists/${id}`, {
        method: 'DELETE',
      }).then(() => undefined),
      (data) => {
        data.lists = data.lists.filter(l => l.id !== id);
        data.items = data.items.filter(i => i.listId !== id);
      }
    );
  },

  addItem: async (item: ListItem) => {
    return withOfflineFallback(
      () => sendRequest('/api/items', {
        method: 'POST',
        body: JSON.stringify(item)
      }).then(() => undefined),
      (data) => {
        data.items.unshift(item);
      }
    );
  },

  toggleItem: async (id: string, completed: boolean) => {
    return withOfflineFallback(
      () => sendRequest(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed })
      }).then(() => undefined),
      (data) => {
        const item = data.items.find(i => i.id === id);
        if (item) item.completed = completed;
      }
    );
  },

  deleteItem: async (id: string) => {
    return withOfflineFallback(
      () => sendRequest(`/api/items/${id}`, {
        method: 'DELETE',
      }).then(() => undefined),
      (data) => {
        data.items = data.items.filter(i => i.id !== id);
      }
    );
  },

  updateListOrder: async (listId: string, items: ListItem[]) => {
    return withOfflineFallback(
      () => sendRequest(`/api/lists/${listId}/items`, {
        method: 'PUT',
        body: JSON.stringify({ items })
      }).then(() => undefined),
      (data) => {
        const otherItems = data.items.filter(i => i.listId !== listId);
        data.items = [...items, ...otherItems];
      }
    );
  }
};
