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
  const [rect, setRect] = useState<{ top?: number; bottom?: number; left: number; width: number; maxH: number } | null>(null);
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

  /**
   * Coloca la lista.
   *
   * Antes se fijaba en `top: rect.bottom + 4` sin más: con el campo en la mitad
   * baja de la pantalla, la lista (240px) se salía por abajo. Medido a 390x844
   * con el campo del modal de receta: la lista iba de 630 a 870 sobre un
   * viewport de 844 — y eso sin contar la barra inferior.
   *
   * Ahora se mide el espacio real y, si abajo no cabe, se abre hacia arriba. La
   * altura se acota a lo que haya disponible, así que nunca queda fuera.
   *
   * El ancho se toma de la FILA del ingrediente (`data-fila-ingrediente`), no
   * del campo de texto: el campo es estrecho y los nombres del catálogo son
   * largos ("AGUERRIDO, REFUGIO CUPREATA CAPON ZACATE LIMON"). Si no hay fila
   * marcada, se cae al ancho del propio campo.
   */
  const RESERVA_INFERIOR = 76;  // barra de navegación + área segura
  const MARGEN = 4;

  /**
   * Alto realmente visible, **descontando el teclado**.
   *
   * `window.innerHeight` NO cambia cuando iOS abre el teclado: sigue midiendo la
   * ventana completa, teclado incluido. Por eso la lista se calculaba con un
   * espacio que ya no existía y acababa debajo del teclado — y al cerrarlo
   * volvía a su sitio, que es exactamente el síntoma descrito.
   *
   * `visualViewport` sí refleja lo que el usuario ve. `offsetTop` recoge además
   * el desplazamiento que hace el navegador para revelar el campo enfocado.
   */
  const altoVisible = () => {
    const vv = window.visualViewport;
    return vv ? vv.height + vv.offsetTop : window.innerHeight;
  };

  const updateRect = () => {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fila = el.closest('[data-fila-ingrediente]') as HTMLElement | null;
    const rf = fila ? fila.getBoundingClientRect() : r;

    const limite = altoVisible();
    const abajo = limite - r.bottom - RESERVA_INFERIOR - MARGEN;
    const arriba = r.top - MARGEN;
    const haciaArriba = abajo < 140 && arriba > abajo;

    setRect(haciaArriba
      ? { bottom: limite - r.top + MARGEN, left: rf.left, width: rf.width, maxH: Math.max(120, Math.min(280, arriba)) }
      : { top: r.bottom + MARGEN, left: rf.left, width: rf.width, maxH: Math.max(120, Math.min(280, abajo)) });
  };

  useEffect(() => {
    if (!isOpen) return;
    updateRect();
    const handler = () => updateRect();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    // Abrir o cerrar el teclado dispara `visualViewport.resize`, NO
    // `window.resize`. Sin esto la lista se quedaba donde estaba y el usuario
    // veía los resultados fuera de sitio hasta cerrar el teclado.
    const vv = window.visualViewport;
    vv?.addEventListener('resize', handler);
    vv?.addEventListener('scroll', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
      vv?.removeEventListener('resize', handler);
      vv?.removeEventListener('scroll', handler);
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
          style={{
            position: 'fixed', left: rect.left, width: rect.width, zIndex: 9999,
            ...(rect.top !== undefined ? { top: rect.top } : { bottom: rect.bottom }),
            maxHeight: rect.maxH,
            // Deja el scroll vertical al navegador; sin esto el gesto se pierde.
            touchAction: 'pan-y', overscrollBehavior: 'contain',
          }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-y-auto animate-in fade-in-0"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <li
                key={item.id}
                // `onClick`, NO `onPointerDown`. En táctil `pointerdown` se dispara al
                // POSAR el dedo, así que arrastrar para ver más opciones
                // seleccionaba la de debajo; y su `preventDefault()` cancelaba el
                // gesto de scroll del navegador, dejando la lista inmanejable.
                // El clic solo llega si el navegador ha decidido que fue un toque
                // y no un arrastre, que es justo la distinción que hacía falta.
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-4 py-3 cursor-pointer text-sm leading-snug break-words text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/60 last:border-0 ${activeIndex === index ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : ''}`}
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
