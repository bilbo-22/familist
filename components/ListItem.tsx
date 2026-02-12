
import React from 'react';
import { Trash2, Check, GripVertical } from 'lucide-react';
import { ListItem as ListItemType } from '../types';

interface ListItemProps {
  item: ListItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;

  // Pointer Props for Mobile/Desktop handle drag
  onPointerStart: (e: React.PointerEvent, index: number) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerEnd: () => void;

  index: number;
}

const ListItem: React.FC<ListItemProps> = ({
  item,
  onToggle,
  onDelete,
  onPointerStart,
  onPointerMove,
  onPointerEnd,
  index
}) => {
  const isDraggable = index >= 0;
  const containerStateClass = item.completed
    ? 'bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-75'
    : 'bg-white dark:bg-dark-card border-peach-100 dark:border-gray-700';
  const checkboxStateClass = item.completed
    ? 'bg-peach-400 border-peach-400 text-white'
    : 'border-gray-300 dark:border-gray-500 hover:border-peach-300';
  const textStateClass = item.completed
    ? 'text-gray-400 dark:text-gray-500 line-through decoration-peach-300 decoration-2'
    : 'text-gray-800 dark:text-gray-100';

  return (
    <div
      data-draggable-item={isDraggable ? 'true' : undefined}
      className={`
        group flex items-center gap-3 p-4 mb-3 rounded-xl shadow-sm border 
        transition-all duration-200 ease-out hover:shadow-md relative
        cursor-grab active:cursor-grabbing
        ${containerStateClass}
      `}
    >
      <div
        className="text-gray-300 dark:text-gray-600 hover:text-gray-500 -ml-1 p-2 -m-2"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => onPointerStart(e, index)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <GripVertical size={18} className="pointer-events-none" />
      </div>

      {/* Checkbox Area */}
      <button
        onClick={() => onToggle(item.id)}
        className={`
          flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
          ${checkboxStateClass}
        `}
      >
        {item.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0 flex flex-col select-none">
        <span
          dir="auto"
          className={`
            text-lg truncate transition-all duration-300
            ${textStateClass}
          `}
        >
          {item.text}
        </span>
      </div>

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
