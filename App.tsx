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
const SOCKET_URL = isProduction ? window.location.origin : 'http://localhost:3001';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'admin';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');
  const [items, setItems] = useState<ListItemType[]>([]);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('familist_theme');
    return (saved as Theme) || Theme.LIGHT;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const itemsRef = useRef<ListItemType[]>([]);

  const pointerStartY = useRef<number>(0);
  const touchDraggedElement = useRef<HTMLElement | null>(null);
  const isDragging = useRef<boolean>(false);
  const MOUSE_DRAG_THRESHOLD = 4;
  const TOUCH_PEN_DRAG_THRESHOLD = 10;

  const handleNoopPointerStart = useCallback((_e: React.PointerEvent, _index: number) => {}, []);
  const handleNoopPointerMove = useCallback((_e: React.PointerEvent) => {}, []);
  const handleNoopPointerEnd = useCallback(() => {}, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const reorderActiveItemsInList = useCallback((allItems: ListItemType[], fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return allItems;

    const listItems = allItems.filter(i => i.listId === activeListId);
    const activeListItems = listItems.filter(i => !i.completed);
    const completedListItems = listItems.filter(i => i.completed);

    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= activeListItems.length ||
      toIndex >= activeListItems.length
    ) {
      return allItems;
    }

    const nextActiveItems = [...activeListItems];
    const [movedItem] = nextActiveItems.splice(fromIndex, 1);
    nextActiveItems.splice(toIndex, 0, movedItem);

    const otherItems = allItems.filter(i => i.listId !== activeListId);
    return [...nextActiveItems, ...completedListItems, ...otherItems];
  }, [activeListId]);

  useEffect(() => {
    const token = localStorage.getItem('familist_token');
    if (token === APP_PASSWORD) {
      setIsAuthenticated(true);
    }
  }, []);

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

    socketRef.current.on('sync', (data: { lists: List[], items: ListItemType[] }) => {
      console.log('Received sync', data);
      setLists(data.lists || []);
      setItems(data.items || []);

      setActiveListId(prev => {
        if (!prev && data.lists.length > 0) return data.lists[0].id;
        if (prev && !data.lists.find(l => l.id === prev) && data.lists.length > 0) {
          return data.lists[0].id;
        }
        return prev;
      });
    });

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

  const handleLogin = (password: string) => {
    if (password === APP_PASSWORD) {
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

  const createList = useCallback((name: string) => {
    const newList: List = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
    };

    setLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    setIsSidebarOpen(false);

    api.createList(newList).catch(err => {
      console.error("Failed to create list", err);
    });
  }, []);

  const deleteList = useCallback((id: string) => {
    if (lists.length <= 1) {
      alert("You must have at least one list.");
      return;
    }

    setLists(prev => prev.filter(l => l.id !== id));
    setItems(prev => prev.filter(i => i.listId !== id));

    if (activeListId === id) {
      const remaining = lists.filter(l => l.id !== id);
      if (remaining.length > 0) {
        setActiveListId(remaining[0].id);
      }
    }

    api.deleteList(id).catch(console.error);
  }, [lists, activeListId]);

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

      setItems(prev => [newItem, ...prev]);

      api.addItem(newItem).catch(console.error);
    });
  }, [activeListId]);

  const toggleItem = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newStatus = !item.completed;

    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, completed: newStatus } : i
    ));

    api.toggleItem(id, newStatus).catch(console.error);
  }, [items]);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));

    api.deleteItem(id).catch(console.error);
  }, []);

  const handlePointerStart = (e: React.PointerEvent, index: number) => {
    if (index < 0) return;
    dragItem.current = index;
    dragOverItem.current = index;
    pointerStartY.current = e.clientY;
    touchDraggedElement.current = e.currentTarget.parentElement as HTMLElement;
    isDragging.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);

    if (touchDraggedElement.current) {
      touchDraggedElement.current.style.opacity = '0.5';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragItem.current === null) return;

    const pointerY = e.clientY;
    const dragThreshold = e.pointerType === 'mouse'
      ? MOUSE_DRAG_THRESHOLD
      : TOUCH_PEN_DRAG_THRESHOLD;

    if (!isDragging.current && Math.abs(pointerY - pointerStartY.current) < dragThreshold) {
      return;
    }
    isDragging.current = true;
    e.preventDefault(); // Handle is for dragging only, so always prevent scroll

    const elements = document.querySelectorAll('[data-draggable-item="true"]');

    let newIndex = dragItem.current;
    elements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      if (pointerY >= rect.top && pointerY <= rect.bottom) {
        newIndex = idx;
      }
    });

    if (newIndex !== dragItem.current && newIndex !== dragOverItem.current) {
      dragOverItem.current = newIndex;
      const fromIndex = dragItem.current;
      setItems(prev => reorderActiveItemsInList(prev, fromIndex, newIndex));

      dragItem.current = newIndex;
    }
  };

  const handlePointerEnd = () => {
    if (isDragging.current) {
      const currentListItems = itemsRef.current.filter(i => i.listId === activeListId);
      api.updateListOrder(activeListId, currentListItems).catch(console.error);
    }

    if (touchDraggedElement.current) {
      touchDraggedElement.current.style.opacity = '1';
      touchDraggedElement.current = null;
    }

    dragItem.current = null;
    dragOverItem.current = null;
    pointerStartY.current = 0;
    isDragging.current = false;
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const currentList = lists.find(l => l.id === activeListId);
  const listItems = items.filter(i => i.listId === activeListId);
  const activeItems = listItems.filter(i => !i.completed);
  const completedItems = listItems.filter(i => i.completed);

  return (
    <div className="min-h-screen flex flex-col pb-32 transition-colors duration-500">
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

        {listItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
            <div className="w-24 h-24 bg-peach-100 dark:bg-dark-card rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={48} className="text-peach-300" />
            </div>
            <p className="text-lg font-medium">List is empty</p>
            <p className="text-sm">Type or record audio to add items</p>
          </div>
        )}

        <div className="space-y-1">
          {activeItems.map((item, index) => (
            <ListItem
              key={item.id}
              index={index}
              item={item}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onPointerStart={handlePointerStart}
              onPointerMove={handlePointerMove}
              onPointerEnd={handlePointerEnd}
            />
          ))}
        </div>

        {completedItems.length > 0 && activeItems.length > 0 && (
          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</span>
            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
          </div>
        )}

        <div className="space-y-1 opacity-70 hover:opacity-100 transition-opacity">
          {completedItems.map((item) => (
            <ListItem
              key={item.id}
              index={-1}
              item={item}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onPointerStart={handleNoopPointerStart}
              onPointerMove={handleNoopPointerMove}
              onPointerEnd={handleNoopPointerEnd}
            />
          ))}
        </div>
      </main>

      <AudioInputArea onAddItems={addItems} />
    </div>
  );
};

export default App;
