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

// Tolera el nombre ausente a propósito.
//
// El tipo declara `nombre: string`, pero los ingredientes llegan de Firestore
// con un `as Ingredient` sin validar. Bastaba UN documento sin nombre para que
// `.toLowerCase()` lanzara dentro del `.filter`, y como el filtro corre en un
// `setTimeout` el error se perdía: la lista se quedaba vacía y el desplegable
// decía "Sin resultados" para cualquier búsqueda, siempre.
const normalizeStr = (str?: string | null) =>
  (str ?? '')
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
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refleja en el campo el ingrediente ya elegido.
  //
  // NO depende de `items`: cada vez que esa lista cambiaba de referencia, el
  // efecto volvía a correr y machacaba con '' lo que estuvieras tecleando. La
  // lista se consulta por referencia para poder leerla sin declararla
  // dependencia.
  const refItems = useRef(items);
  refItems.current = items;
  useEffect(() => {
    const selectedItem = refItems.current.find(item => item.id === selectedId);
    if (selectedItem) setSearchTerm(selectedItem.nombre);
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

  // Filtrado síncrono.
  //
  // Antes vivía en un `setTimeout` dentro de un efecto que escribía a estado.
  // Ese montaje tenía dos trampas: cualquier excepción dentro del temporizador
  // se perdía sin llegar a consola y dejaba la lista vacía para siempre —el
  // desplegable respondía "Sin resultados" a todo—, y el resultado podía quedar
  // desfasado respecto a lo tecleado. Un `useMemo` no puede desincronizarse ni
  // tragarse un error: si algo falla, falla a la vista.
  const filteredItems = React.useMemo(() => {
    const normalizedSearch = normalizeStr(searchTerm);
    if (!normalizedSearch) return [];
    return items
      .filter(item => normalizeStr(item.nombre).includes(normalizedSearch))
      .slice(0, 50);
  }, [searchTerm, items]);

  useEffect(() => { setActiveIndex(filteredItems.length > 0 ? 0 : -1); }, [filteredItems]);

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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target) && !(target as HTMLElement).closest?.('[data-autocomplete-portal]')) {
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
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-4 py-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-200 ${activeIndex === index ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : ''}`}
              >
                {item.nombre}
              </li>
            ))
          ) : searchTerm ? (
            <li className="px-4 py-2.5 text-sm text-slate-400">Sin resultados en el inventario</li>
          ) : (
            <li className="px-4 py-2.5 text-xs text-slate-400 italic">Escribe para buscar en tu inventario…</li>
          )}
        </ul>,
        document.body
      )}
    </div>
  );
};
