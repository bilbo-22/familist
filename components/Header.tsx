
import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { Theme } from '../types';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  onOpenMenu: () => void;
  currentListName: string;
}

const Header: React.FC<HeaderProps> = ({ 
  theme, 
  toggleTheme, 
  onOpenMenu,
  currentListName,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-sm sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenMenu}
          className="p-2 -ml-2 rounded-full hover:bg-peach-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-200 transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-800 dark:text-peach-100 leading-none tracking-tight">
            {currentListName}
          </h1>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Familist</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-peach-100 dark:hover:bg-gray-700 text-gray-600 dark:text-peach-200 transition-colors"
          title="Toggle Theme"
        >
          {theme === Theme.LIGHT ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
