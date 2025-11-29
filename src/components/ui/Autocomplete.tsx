import React, { useState, useEffect, useRef } from 'react';
import { Ingredient } from '../../../types';
import { Input } from './Input';
import { Icon } from './Icon';
import { ICONS } from './icons';

interface AutocompleteProps {
  items: Ingredient[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
}

/**
 * Normalizes and cleans a string for fuzzy searching.
 * @param str The string to normalize.
 * @returns A lowercased, accent-free, and trimmed string.
 */
const normalizeStr = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const Autocomplete: React.FC<AutocompleteProps> = ({
  items,
  selectedId,
  onSelect,
  placeholder = 'Buscar...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Ingredient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial input value from selectedId
  useEffect(() => {
    const selectedItem = items.find(item => item.id === selectedId);
    setSearchTerm(selectedItem ? selectedItem.nombre : '');
  }, [selectedId, items]);

  // Debounced search logic
  useEffect(() => {
    if (!isOpen) return;

    const handler = setTimeout(() => {
      if (searchTerm.length < 1) {
        setFilteredItems([]);
        return;
      }

      const normalizedSearch = normalizeStr(searchTerm);
      const sorted = [...items]
        .map(item => ({
          ...item,
          relevance: normalizeStr(item.nombre).includes(normalizedSearch) ? 1 : 0, // Simple relevance
        }))
        .filter(item => item.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);

      setFilteredItems(sorted);
      setActiveIndex(0);
    }, 120); // 120ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm, items, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredItems[activeIndex]) {
        handleSelect(filteredItems[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: Ingredient) => {
    onSelect(item.id);
    setSearchTerm(item.nombre);
    setIsOpen(false);
    setActiveIndex(-1);
  };
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={e => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if(e.target.value === '') onSelect(null); // Clear selection if input is cleared
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 w-full"
      />
      {isOpen && (
        <ul className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-y-auto max-h-60 animate-in fade-in-0 zoom-in-95">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <li
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-4 py-2 cursor-pointer text-sm ${
                  activeIndex === index ? 'bg-slate-100 dark:bg-slate-700' : ''
                }`}
              >
                {item.nombre}
              </li>
            ))
          ) : searchTerm ? (
            <li className="px-4 py-2 text-sm text-slate-500">Sin resultados</li>
          ) : null}
        </ul>
      )}
    </div>
  );
};
