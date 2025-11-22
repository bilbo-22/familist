import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io, Socket } from 'socket.io-client';
import Header from './components/Header';
import ListItem from './components/ListItem';
import AudioInputArea from './components/AudioInputArea';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import { ListItem as ListItemType, List, Theme } from './types';
import { ShoppingBag } from 'lucide-react';
import { api } from './services/api';

// Determine Socket URL
// Safely check for import.meta.env (Vite specific) to avoid runtime errors in other environments
const isProduction = (import.meta as any).env?.MODE === 'production';
const SOCKET_URL = isProduction ? window.location.origin : 'http://localhost:3000';

const App: React.FC = () => {
  // --- State: Auth ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- State: Lists ---
  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');

  // --- State: Items ---
  const [items, setItems] = useState<ListItemType[]>([]);

  // --- State: UI ---
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('familist_theme');
    return (saved as Theme) || Theme.LIGHT;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // DnD State
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // --- Initial Setup & Effects ---

  useEffect(() => {
    const token = localStorage.getItem('familist_token');
    const appPassword = import.meta.env.VITE_APP_PASSWORD || 'admin';
    if (token === appPassword) {
      setIsAuthenticated(true);
    }
  }, []);

  // Socket.io Connection
  useEffect(() => {
    if (!isAuthenticated) return;

    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Real-time Sync Listener
    socketRef.current.on('sync', (data: { lists: List[], items: ListItemType[] }) => {
      console.log('Received sync', data);
      setLists(data.lists || []);
      setItems(data.items || []);

      // Set active list if none selected
      setActiveListId(prev => {
        if (!prev && data.lists.length > 0) return data.lists[0].id;
        // If current active list was deleted, switch to first
        if (prev && !data.lists.find(l => l.id === prev) && data.lists.length > 0) {
          return data.lists[0].id;
        }
        return prev;
      });
    });

    // Granular Events
    socketRef.current.on('list:created', (newList: List) => {
      setLists(prev => [...prev, newList]);
    });

    socketRef.current.on('list:deleted', (listId: string) => {
      setLists(prev => prev.filter(l => l.id !== listId));
      setItems(prev => prev.filter(i => i.listId !== listId));
      setActiveListId(prev => prev === listId ? '' : prev);
    });

    socketRef.current.on('item:added', (newItem: ListItemType) => {
      setItems(prev => {
        // Avoid duplicates if we optimistically added it (check by ID if possible, but UUIDs generated on client vs server might differ if not careful. 
        // In this app, IDs are generated on client, so we can check for existence.)
        if (prev.some(i => i.id === newItem.id)) return prev;
        return [newItem, ...prev];
      });
    });

    socketRef.current.on('item:updated', (updatedItem: ListItemType) => {
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    });

    socketRef.current.on('item:deleted', (itemId: string) => {
      setItems(prev => prev.filter(i => i.id !== itemId));
    });

    socketRef.current.on('list:order_updated', ({ listId, items: sortedItems }: { listId: string, items: ListItemType[] }) => {
      setItems(prev => {
        const otherItems = prev.filter(i => i.listId !== listId);
        return [...sortedItems, ...otherItems];
      });
    });

    // Fetch initial data manually to be safe
    api.getData().then(data => {
      setLists(data.lists || []);
      setItems(data.items || []);
      if (!activeListId && data.lists && data.lists.length > 0) {
        setActiveListId(data.lists[0].id);
      }
    }).catch(console.error);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('familist_theme', theme);
  }, [theme]);

  // --- Auth Handlers ---
  const handleLogin = (password: string) => {
    const appPassword = import.meta.env.VITE_APP_PASSWORD || 'admin';
    if (password === appPassword) {
      localStorage.setItem('familist_token', password);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('familist_token');
    setIsAuthenticated(false);
    setIsSidebarOpen(false);
    socketRef.current?.disconnect();
  };

  // --- List Management ---
  const createList = useCallback((name: string) => {
    const newList: List = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
    };

    // Optimistic Update
    setLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    setIsSidebarOpen(false);

    // API Call
    api.createList(newList).catch(err => {
      console.error("Failed to create list", err);
      // Revert state if needed, but next sync will fix it
    });
  }, []);

  const deleteList = useCallback((id: string) => {
    if (lists.length <= 1) {
      alert("You must have at least one list.");
      return;
    }

    // Optimistic Update
    setLists(prev => prev.filter(l => l.id !== id));
    setItems(prev => prev.filter(i => i.listId !== id));

    if (activeListId === id) {
      const remaining = lists.filter(l => l.id !== id);
      if (remaining.length > 0) {
        setActiveListId(remaining[0].id);
      }
    }

    // API Call
    api.deleteList(id).catch(console.error);
  }, [lists, activeListId]);

  // --- Item Handlers ---
  const toggleTheme = () => setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);

  const addItems = useCallback((texts: string[]) => {
    if (!activeListId) return;

    texts.forEach(text => {
      const newItem: ListItemType = {
        id: uuidv4(),
        listId: activeListId,
        text,
        completed: false,
        createdAt: Date.now(),
      };

      // Optimistic Update
      setItems(prev => [newItem, ...prev]);

      // API Call
      api.addItem(newItem).catch(console.error);
    });
  }, [activeListId]);

  const toggleItem = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newStatus = !item.completed;

    // Optimistic Update
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, completed: newStatus } : i
    ));

    // API Call
    api.toggleItem(id, newStatus).catch(console.error);
  }, [items]);

  const deleteItem = useCallback((id: string) => {
    // Optimistic Update
    setItems(prev => prev.filter(item => item.id !== id));

    // API Call
    api.deleteItem(id).catch(console.error);
  }, []);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    dragOverItem.current = index;

    if (dragItem.current !== null && dragItem.current !== index) {
      // We need to calculate the new order based on the filtered view
      const currentListItems = items.filter(i => i.listId === activeListId);

      const draggedItem = currentListItems[dragItem.current];
      // const targetItem = currentListItems[index];

      // Create a new array for the UI
      const newListItems = [...currentListItems];
      newListItems.splice(dragItem.current, 1);
      newListItems.splice(index, 0, draggedItem);

      // Update Global Items State by replacing the chunk that belongs to this list
      setItems(prev => {
        const otherItems = prev.filter(i => i.listId !== activeListId);
        // We need to be careful to preserve sorting. 
        // For now, assuming the "others" are just appended.
        return [...newListItems, ...otherItems];
      });

      dragItem.current = index;
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    dragItem.current = null;
    dragOverItem.current = null;

    // Send the new order to the server
    const currentListItems = items.filter(i => i.listId === activeListId);
    api.updateListOrder(activeListId, currentListItems).catch(console.error);
  };

  // --- Render Logic ---

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const currentList = lists.find(l => l.id === activeListId);

  // Safety check
  if (!currentList && lists.length > 0 && activeListId) {
    // Logic handled in useEffect, but render safety here
  }

  const listItems = items.filter(i => i.listId === activeListId);
  // Simple client-side sort to keep completed at bottom if desired, 
  // BUT for DnD to work, we usually respect the array order.
  // Let's respect array order for "Active" items, and push "Completed" to bottom visually if we want,
  // or just render in order. The previous design separated them. 
  // To support DnD properly with the separator, we usually only drag active items.

  const activeItems = listItems.filter(i => !i.completed);
  const completedItems = listItems.filter(i => i.completed);

  return (
    <div className="min-h-screen flex flex-col pb-32 transition-colors duration-500">
      {/* Connection Indicator (subtle) */}
      {!isConnected && (
        <div className="bg-red-500 h-1 w-full fixed top-0 left-0 z-50" title="Disconnected - attempting to reconnect..." />
      )}

      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenMenu={() => setIsSidebarOpen(true)}
        currentListName={currentList?.name || "My List"}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        lists={lists}
        activeListId={activeListId}
        onSelectList={setActiveListId}
        onCreateList={createList}
        onDeleteList={deleteList}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6">

        {/* Empty State */}
        {listItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
            <div className="w-24 h-24 bg-peach-100 dark:bg-dark-card rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={48} className="text-peach-300" />
            </div>
            <p className="text-lg font-medium">List is empty</p>
            <p className="text-sm">Type or record audio to add items</p>
          </div>
        )}

        {/* Active Items */}
        <div className="space-y-1">
          {activeItems.map((item, index) => (
            <ListItem
              key={item.id}
              index={index}
              item={item}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>

        {/* Completed Items Separator */}
        {completedItems.length > 0 && activeItems.length > 0 && (
          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</span>
            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
          </div>
        )}

        {/* Completed Items */}
        <div className="space-y-1 opacity-70 hover:opacity-100 transition-opacity">
          {completedItems.map((item) => (
            <ListItem
              key={item.id}
              index={-1} // Disable drag for completed
              item={item}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onDragStart={(e) => e.preventDefault()}
              onDragEnter={(e) => { }}
              onDragEnd={(e) => { }}
            />
          ))}
        </div>
      </main>

      <AudioInputArea onAddItems={addItems} />
    </div>
  );
};

export default App;