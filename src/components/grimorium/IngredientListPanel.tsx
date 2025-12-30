import React, { useRef } from 'react';
import { Ingredient } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useSuppliers } from '../../features/suppliers/hooks/useSuppliers';
import { useSupplierProducts } from '../../features/suppliers/hooks/useSupplierProducts';
import { useApp } from '../../context/AppContext';
import { CatalogoItem } from '../../types';
import { getCategoryColor } from '../../utils/categoryColors';
import { evaluateMarketSignals } from '../../core/signals/signal.engine';
import { Signal } from '../../core/signals/signal.types';


interface IngredientListPanelProps {
  ingredients: Ingredient[];
  selectedIngredientIds: string[];
  viewingIngredientId: string | null;
  onToggleSelection: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onDeleteSelected: () => void;
  onImportCSV: () => void;
  onEditIngredient: (ingredient: Ingredient) => void; // Used for "viewing"
  onNewIngredient: () => void;

  // Search & Filter Props
  ingredientSearchTerm: string;
  onIngredientSearchChange: (val: string) => void;
  ingredientFilters: { category: string; status: string };
  onIngredientFilterChange: (key: string, value: string) => void;
  availableCategories: string[]; // Added
  onBuy?: (ingredient: Ingredient) => void;
  onBulkBuy?: () => void; // Added onBulkBuy
  disableStockAlerts?: boolean;
}

export const IngredientListPanel: React.FC<IngredientListPanelProps> = ({
  ingredients,
  selectedIngredientIds,
  viewingIngredientId,
  onToggleSelection,
  onSelectAll,
  onDeleteSelected,
  onImportCSV,
  onEditIngredient,
  onNewIngredient,

  ingredientSearchTerm,
  onIngredientSearchChange,
  ingredientFilters,
  onIngredientFilterChange,
  availableCategories, // Added
  onBuy,
  onBulkBuy, // Destructured
  disableStockAlerts = false
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Use passed availableCategories
  const uniqueCategories = availableCategories.sort();

  // Providers Hook
  const { db, userId } = useApp();
  const { suppliers: proveedores } = useSuppliers({ db, userId });

  // Providers State
  const [selectedProveedorId, setSelectedProveedorId] = React.useState<string>('all');

  // Combined Filter Logic
  const filteredIngredients = React.useMemo(() => {
    let result = ingredients;

    // A. Provider Filter (Simple Link Check)
    if (selectedProveedorId !== 'all') {
      result = result.filter(ing => {
        return ing.proveedores?.includes(selectedProveedorId);
      });
    }

    // B. Category Filter
    if (ingredientFilters.category && ingredientFilters.category !== 'all') {
      result = result.filter(ing => ing.categoria === ingredientFilters.category);
    }

    // C. Search Term Filter
    if (ingredientSearchTerm) {
      const lowerCaseSearchTerm = ingredientSearchTerm.toLowerCase();
      result = result.filter(ing =>
        ing.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
        ing.categoria.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    return result;
  }, [ingredients, selectedProveedorId, ingredientFilters.category, ingredientSearchTerm]);

  // Phase 2.1.B+ - Aggregation Logic
  const aggregatedProducts = React.useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      category: string;
      entries: Ingredient[];
      minPrice: number;
      maxPrice: number;
    }>();

    // Helper: Tokenize a name
    // Helper: Tokenize a name
    const STOP_WORDS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'y', 'o', 'con', 'sin', 'por', 'para', 'un', 'una']);
    const WEAK_TOKENS = new Set(['vodka', 'ron', 'gin', 'ginebra', 'tequila', 'whisky', 'whiskey', 'brandy', 'licor', 'cerveza', 'vino', 'sirope', 'pure', 'zumo', 'jugo', 'refresco', 'agua', 'hoja', 'hojas']);

    const getTokens = (str: string) => str.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "") // remove special chars
      .split(/\s+/)
      .filter(t => t.length >= 2 && !STOP_WORDS.has(t)); // Allow 2 chars but filter

    // Helper: Check if two sets of tokens match
    const doTokensMatch = (tokensA: string[], tokensB: string[]) => {
      // If either has no tokens, no match
      if (tokensA.length === 0 || tokensB.length === 0) return false;

      let hasStrongMatch = false;
      let weakMatchCount = 0;

      tokensA.forEach(tA => {
        const isWeak = WEAK_TOKENS.has(tA);
        // Check if tA matches any in tokensB
        const matched = tokensB.some(tB => {
          // Exact match
          if (tA === tB) return true;
          // Prefix match
          if (tA.length >= 3 && (tA.startsWith(tB) || tB.startsWith(tA))) return true;
          // Containment: ONLY if token > 3 chars
          if (tA.length > 3 && tB.length > 3) {
            return tA.includes(tB) || tB.includes(tA);
          }
          return false;
        });

        if (matched) {
          if (isWeak) weakMatchCount++;
          else hasStrongMatch = true;
        }
      });

      const targetHasStrongTokens = tokensA.some(t => !WEAK_TOKENS.has(t));

      if (!targetHasStrongTokens) {
        return weakMatchCount > 0;
      }

      // Must have at least one strong match
      return hasStrongMatch;
    };

    filteredIngredients.forEach(ing => {
      // We need to find if this ingredient belongs to an EXISTING group
      // This is O(N^2) effectively, but N is small (filtered ingredients)

      const currentTokens = getTokens(ing.nombre);
      let foundKey: string | undefined;

      // Try to match against existing groups
      for (const [key, group] of map.entries()) {
        // Check against group name (primary)
        const groupTokens = getTokens(group.name);
        if (doTokensMatch(currentTokens, groupTokens)) {
          foundKey = key;
          break;
        }
        // Or check against any entry in the group (transitive)
        // (Skipped for performance, usually group name is representative)
      }

      if (foundKey) {
        const group = map.get(foundKey)!;
        group.entries.push(ing);
        // Update stats
        if (ing.precioCompra && ing.precioCompra > 0) {
          group.minPrice = Math.min(group.minPrice, ing.precioCompra);
          group.maxPrice = Math.max(group.maxPrice, ing.precioCompra);
        }
        // Update group name if current is longer/better? No, keep first found.
      } else {
        // Create new group
        const key = ing.id; // Use ID as key since we don't have a canonical name
        map.set(key, {
          id: ing.id,
          name: ing.nombre,
          category: ing.categoria || 'General',
          entries: [ing],
          minPrice: ing.precioCompra || Infinity,
          maxPrice: ing.precioCompra || -Infinity
        });
        // Fix infinity if no price
        if (!ing.precioCompra) {
          const g = map.get(key)!;
          g.minPrice = Infinity;
          g.maxPrice = -Infinity;
        }
      }
    });

    return Array.from(map.values());
  }, [filteredIngredients]);


  return (
    <div className="h-full flex flex-col bg-transparent border-0 shadow-none w-full max-w-[97%] px-8">
      {/* Unique Integrated Header */}
      <div className="py-4 flex flex-col gap-4 w-full justify-start">
        {/* 1. Search Bar - Expands */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon svg={ICONS.search} className="h-4 w-4 text-emerald-500/50 group-focus-within:text-emerald-600 transition-colors" />
          </div>
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar ingrediente..."
            className="pl-10 h-10 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500 rounded-xl w-full transition-all"
            value={ingredientSearchTerm}
            onChange={(e) => onIngredientSearchChange(e.target.value)}
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full text-xs relative z-50">

          {/* Custom Category Dropdown with Color Dots - FLEX 1 */}
          <div className="relative flex-1 min-w-[120px]" ref={dropdownRef}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm flex items-center gap-2 w-full text-left relative hover:bg-white/80 transition-colors"
            >
              {ingredientFilters.category && ingredientFilters.category !== 'all' ? (
                <>
                  <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(ingredientFilters.category)}`} />
                  <span className="truncate max-w-[100px]">{ingredientFilters.category}</span>
                </>
              ) : (
                <span className="text-slate-500">Categoría</span>
              )}
              <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[100] p-1">
                <button
                  onClick={() => { onIngredientFilterChange('category', 'all'); setShowCategoryDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <span className="text-slate-500">Todas</span>
                </button>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { onIngredientFilterChange('category', cat); setShowCategoryDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(cat)}`} />
                    <span className="truncate">{cat}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Provider Selector - FLEX 1 */}
          <div className="relative group/prov flex-1 min-w-[120px]">
            <select
              className="h-10 pl-3 pr-8 w-full bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-xl text-slate-800 dark:text-slate-100 border-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer text-sm font-medium appearance-none"
              value={selectedProveedorId}
              onChange={(e) => setSelectedProveedorId(e.target.value)}
            >
              <option value="all" className="text-slate-800">Todos los productos</option>
              {proveedores.map(prov => (
                <option key={prov.id} value={prov.id} className="text-slate-800">{prov.name}</option>
              ))}
            </select>
            {/* Custom Arrow because appearance-none removes default */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/prov:text-slate-800 dark:group-hover/prov:text-slate-200 transition-colors">
              <Icon svg={ICONS.chevronDown} className="w-3 h-3" />
            </div>
          </div>


          {/* Small Actions */}
          <div className="flex gap-1 items-center ml-1">
            <Button variant="outline" size="icon" onClick={onImportCSV} title="Importar CSV" className="border-slate-200 dark:border-slate-700 h-10 w-10">
              <Icon svg={ICONS.upload} className="w-4 h-4" />
            </Button>
            {selectedIngredientIds.length > 0 && (
              <>
                {/* BULK BUY BUTTON */}
                {onBulkBuy && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onBulkBuy}
                    className="h-10 !bg-emerald-50 !text-emerald-700 border border-emerald-200 hover:!bg-emerald-600 hover:!text-white hover:border-emerald-600 transition-colors font-bold mr-1"
                  >
                    Comprar ({selectedIngredientIds.length})
                  </Button>
                )}

                <Button variant="destructive" size="icon" onClick={onDeleteSelected} title="Eliminar Seleccionados" className="h-10 w-10">
                  <Icon svg={ICONS.trash} className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button onClick={onNewIngredient} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 h-10 w-10 p-0 rounded-xl transition-all hover:scale-105 active:scale-95">
              <Icon svg={ICONS.plus} className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* List Header (Column Names) */}
      <div className="px-4 py-2 bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 w-full">
        <div className="flex items-center">
          <div className="w-8 shrink-0 flex justify-center">
            <input
              type="checkbox"
              checked={selectedIngredientIds.length === filteredIngredients.length && filteredIngredients.length > 0}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-white/30 bg-white/20 text-emerald-500 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex-1 px-4">Detalles</div>
          <div className="w-24 text-right">Precio / Unidad</div>
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 w-full z-0">
        {aggregatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
            <Icon svg={ICONS.flask} className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">No hay ingredientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
            {aggregatedProducts.map((group) => {
              // Find "best" or primary entry to display
              // Prioritize entries WITH price, then by price ascending
              const sortedEntries = [...group.entries].sort((a, b) => {
                const pA = a.precioCompra && a.precioCompra > 0 ? a.precioCompra : 999999;
                const pB = b.precioCompra && b.precioCompra > 0 ? b.precioCompra : 999999;
                return pA - pB;
              });
              const primaryEntry = sortedEntries[0];
              const ing = primaryEntry;

              const isSelected = selectedIngredientIds.includes(ing.id);
              const isViewing = viewingIngredientId === ing.id;
              const categoryColor = getCategoryColor(ing.categoria);

              return (
                <div
                  key={group.id}
                  onClick={() => onEditIngredient(ing)}
                  className={`group relative flex flex-col p-0 rounded-2xl border transition-all duration-200 cursor-pointer w-full overflow-hidden
                            ${isViewing
                      ? 'bg-emerald-600 shadow-lg shadow-emerald-900/20 scale-[1.02] border-emerald-500 z-10'
                      : 'bg-white/30 dark:bg-slate-900/30 backdrop-blur-md border-white/10 dark:border-white/5 hover:bg-white/50 hover:shadow-md hover:-translate-y-0.5'
                    }
                  `}
                >
                  <div className="flex items-start p-4 relative z-10 gap-3 h-full">
                    {/* Selection Checkbox - Centered Vertically */}
                    <div className="w-6 shrink-0 flex items-center justify-center pt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(ing.id)}
                        className={`rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 transition-colors cursor-pointer w-4 h-4 ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-white/50'}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-2">
                      {/* Top: Title & Badges */}
                      <div>
                        <div className={`font-bold text-sm tracking-tight leading-snug line-clamp-2 mb-1.5 ${isViewing ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                          {ing.nombre}
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[16px]">
                          {!disableStockAlerts && ((ing as any).stockActual !== undefined && (ing as any).stockActual <= 0) && (
                            <span className="px-1.5 py-0.5 rounded-[4px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold tracking-tight uppercase inline-flex items-center gap-1">
                              <Icon svg={ICONS.alertCircle} className="w-2.5 h-2.5" /> AGOTADO
                            </span>
                          )}
                          {group.entries.length > 1 && (
                            <span className="px-1.5 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-medium inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                              <Icon svg={ICONS.users} className="w-2.5 h-2.5" /> {group.entries.length} opc.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Signal Engine Output (Moved here for space) */}
                      {(() => {
                        const supplierMap: Record<string, any> = {};
                        group.entries.forEach((entry, idx) => {
                          supplierMap[entry.id || `iso_${idx}`] = {
                            price: entry.precioCompra || 0,
                            formatQty: (entry as any).cantidad || 1,
                            formatUnit: entry.unidadCompra || entry.unidad || 'units',
                            updatedAt: (entry.supplierData as any)?.lastUpdated || Date.now()
                          };
                        });

                        const signals = evaluateMarketSignals({
                          product: {
                            id: group.id,
                            name: group.name,
                            category: group.category,
                            supplierData: supplierMap,
                            referencePrice: ing.costo || null,
                            referenceSupplierId: null,
                            unitBase: (ing.unidad as any) || 'units'
                          }
                        });

                        if (signals.length === 0) return null;

                        const visibleSignals = signals
                          .sort((a, b) => (a.severity === 'warning' ? -1 : 1))
                          .slice(0, 2);

                        return (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {visibleSignals.map((sig, sIdx) => (
                              <div
                                key={`${sig.id}-${sIdx}`}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-tight border cursor-help max-w-full truncate ${sig.severity === 'warning'
                                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30'
                                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                                  }`}
                                title={sig.explanation || sig.message}
                              >
                                <Icon
                                  svg={
                                    sig.id === 'MARKET_SAVINGS_OPPORTUNITY' ? ICONS.trendingUp :
                                      sig.id === 'MARKET_SINGLE_SUPPLIER_RISK' ? ICONS.alertCircle :
                                        ICONS.info
                                  }
                                  className={`w-2.5 h-2.5 shrink-0 ${sig.id === 'MARKET_SAVINGS_OPPORTUNITY' ? 'rotate-180' : ''}`}
                                />
                                <span className="truncate">{sig.message.split(':')[0]}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                    </div>

                    {/* Price Column + Buy Action */}
                    <div className="w-auto flex flex-col items-end justify-between h-full gap-2 shrink-0 pl-2 border-l border-slate-100 dark:border-slate-800/50 min-h-[60px]">
                      <div className="text-right">
                        <div className={`font-bold font-mono text-lg leading-none mb-1 ${isViewing ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {ing.precioCompra && ing.precioCompra > 0 ? (
                            <>€{ing.precioCompra.toFixed(2)}</>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">--</span>
                          )}
                        </div>
                        <div className={`text-[9px] uppercase tracking-wider font-medium text-right w-full ${isViewing ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {ing.unidadCompra || ing.unidad || 'Und'}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 px-2 text-[10px] font-bold uppercase tracking-wide !bg-emerald-50 !text-emerald-700 border border-emerald-200 hover:!bg-emerald-600 hover:!text-white hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/20 rounded-lg transition-all duration-300 ${isViewing ? 'hidden' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuy?.(ing);
                        }}
                      >
                        Comprar
                      </Button>
                    </div>
                  </div>

                  {/* Category Color Bar */}
                  <div className={`h-1.5 w-full ${categoryColor} opacity-80`} title={ing.categoria} />

                  {/* Viewing Indicator */}
                  {isViewing && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
                      <Icon svg={ICONS.check} className="w-8 h-8 -rotate-12" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="h-12" /> {/* Bottom spacer for FAB */}
      </div>

      {/* Floating Action Button for New Ingredient */}
      {/* Floating Action Button removed as per request */}
    </div >
  );
};
