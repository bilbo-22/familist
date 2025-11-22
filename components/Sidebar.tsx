
import React, { useState } from 'react';
import { Plus, Trash2, X, LogOut } from 'lucide-react';
import { List } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  lists: List[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (id: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  lists,
  activeListId,
  onSelectList,
  onCreateList,
  onDeleteList,
  onLogout
}) => {
  const [newListName, setNewListName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      onCreateList(newListName.trim());
      setNewListName('');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-dark-card shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-peach-300 rounded-lg flex items-center justify-center text-white font-bold">F</div>
                <h2 className="text-xl font-bold dark:text-white">All Lists</h2>
             </div>
             <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
               <X size={24} />
             </button>
          </div>

          {/* List of Lists */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {lists.map(list => {
              return (
                <div 
                  key={list.id}
                  onClick={() => {
                    onSelectList(list.id);
                    onClose();
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeListId === list.id ? 'bg-peach-50 dark:bg-peach-900/20 text-peach-600 dark:text-peach-300 ring-1 ring-peach-200 dark:ring-peach-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium truncate" dir="auto">{list.name}</span>
                  </div>
                  
                  {lists.length > 1 && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         if (confirm('Are you sure you want to delete this list?')) {
                           onDeleteList(list.id);
                         }
                       }}
                       className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                     >
                       <Trash2 size={16} />
                     </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create New */}
          <form onSubmit={handleCreate} className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New List</label>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                dir="auto"
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-peach-300 dark:text-white transition-all"
              />
              <button 
                type="submit"
                disabled={!newListName.trim()}
                className="p-2 bg-peach-400 text-white rounded-lg hover:bg-peach-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <button 
              type="button"
              onClick={() => {
                if(confirm("Lock lists and exit?")) {
                    onLogout();
                    onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              Lock App
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
