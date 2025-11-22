
import React from 'react';
import { Trash2, Check, GripVertical } from 'lucide-react';
import { ListItem as ListItemType } from '../types';

interface ListItemProps {
  item: ListItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;

  // DnD Props
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;

  // Touch Props for Mobile
  onTouchStart: (e: React.TouchEvent, index: number) => void;
  onTouchMove: (e: React.TouchEvent, index: number) => void;
  onTouchEnd: () => void;

  index: number;
}

const ListItem: React.FC<ListItemProps> = ({
  item,
  onToggle,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  index
}) => {

  return (
    <div
      data-list-item
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`
        group flex items-center gap-3 p-4 mb-3 rounded-xl shadow-sm border 
        transition-all duration-200 ease-out hover:shadow-md relative
        cursor-grab active:cursor-grabbing
        ${item.completed
          ? 'bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-75'
          : 'bg-white dark:bg-dark-card border-peach-100 dark:border-gray-700'
        }
      `}
    >
      {/* Drag Handle - Mobile dragging only works here */}
      <div
        className="text-gray-300 dark:text-gray-600 hover:text-gray-500 -ml-1"
        onTouchStart={(e) => onTouchStart(e, index)}
        onTouchMove={(e) => onTouchMove(e, index)}
        onTouchEnd={onTouchEnd}
      >
        <GripVertical size={18} />
      </div>

      {/* Checkbox Area */}
      <button
        onClick={() => onToggle(item.id)}
        className={`
          flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
          ${item.completed
            ? 'bg-peach-400 border-peach-400 text-white'
            : 'border-gray-300 dark:border-gray-500 hover:border-peach-300'
          }
        `}
      >
        {item.completed && <Check size={14} strokeWidth={3} />}
      </button>

      {/* Text Content */}
      <div className="flex-1 min-w-0 flex flex-col select-none">
        <span
          dir="auto"
          className={`
            text-lg truncate transition-all duration-300
            ${item.completed
              ? 'text-gray-400 dark:text-gray-500 line-through decoration-peach-300 decoration-2'
              : 'text-gray-800 dark:text-gray-100'
            }
          `}
        >
          {item.text}
        </span>
      </div>

      {/* Delete Action */}
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
        aria-label="Delete item"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default ListItem;
