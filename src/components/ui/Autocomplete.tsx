import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Ingredient } from '../../types';
import { Input } from './Input';

interface AutocompleteProps {
  items: Ingredient[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
}

/**
 * Tolera nombres ausentes o no textuales.
 *
 * Antes recibía `str: string` y hacía `.toLowerCase()` directo. Bastaba UN
 * ingrediente sin `nombre` —normal en catálogos importados por CSV— para que
 * lanzara dentro del `setTimeout` del filtro: el temporizador se abortaba en
 * silencio, `filteredItems` se quedaba vacío y el desplegable decía "sin
 * resultados" escribieras lo que escribieras.
 */
const normalizeStr = (str: unknown) =>
  String(str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial input value from selectedId
  useEffect(() => {
    const selectedItem = items.find(item => item.id === selectedId);
    setSearchTerm(selectedItem ? selectedItem.nombre : '');
    // Depende solo de `selectedId`. Con `items` en las dependencias, cualquier
    // cambio de identidad del array reiniciaba `searchTerm` y borraba bajo el
    // dedo lo que el usuario estuviera escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Track input position for the portal dropdown
  const updateRect = () => {
    const el = wrapperRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updateRect();
    const handler = () => updateRect();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!isOpen) return;
    const handler = setTimeout(() => {
      // Sin texto se muestra el principio del catálogo: en un móvil, obligar a
      // teclear a ciegas ante una lista vacía se lee como que no hay nada.
      const normalizedSearch = normalizeStr(searchTerm);
      const sorted = (normalizedSearch
        ? items.filter(item => normalizeStr(item.nombre).includes(normalizedSearch))
        : items
      ).slice(0, 50);
      setFilteredItems(sorted);
      setActiveIndex(0);
    }, 100);
    return () => clearTimeout(handler);
  }, [searchTerm, items, isOpen]);

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
      if (activeIndex >= 0 && filteredItems[activeIndex]) handleSelect(filteredItems[activeIndex]);
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

  // Close on outside click (accounts for the portalled list)
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target) && !(target as HTMLElement).closest?.('[data-autocomplete-portal]')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
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
          if (e.target.value === '') onSelect(null);
        }}
        onFocus={() => { setIsOpen(true); updateRect(); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 w-full"
      />
      {isOpen && rect && createPortal(
        <ul
          data-autocomplete-portal
          style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-y-auto max-h-60 animate-in fade-in-0 zoom-in-95"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <li
                key={item.id}
                onPointerDown={(e) => { e.preventDefault(); handleSelect(item); }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-4 py-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-200 ${activeIndex === index ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : ''}`}
              >
                {item.nombre}
              </li>
            ))
          ) : (
            <li className="px-4 py-2.5 text-sm text-slate-400">
              {items.length === 0 ? 'Cargando inventario…' : 'Sin resultados en el inventario'}
            </li>
          )}
        </ul>,
        document.body
      )}
    </div>
  );
};
