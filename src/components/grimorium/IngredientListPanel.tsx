import React, { useRef } from 'react';
import { Ingredient } from '../../types';
import { Card } from '../ui/Card';
import { EnLaFranjaFija } from '../layout/FranjaFija';
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
import { buscar } from '../../core/search/buscador';
import { agruparProductos } from '../../core/identity/agruparProductos';
import { opcionesDelGrupo } from '../../core/identity/opcionesDeCompra';


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
  const [showProveedorDropdown, setShowProveedorDropdown] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
        setShowProveedorDropdown(false);
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

  // Un grupo abierto a la vez: varios desplegados a la vez convierten la lista
  // en un muro y se pierde justamente la comparación que se venía a hacer.
  const [grupoAbierto, setGrupoAbierto] = React.useState<string | null>(null);

  const nombreProveedor = React.useCallback(
    (id: string | null) => (id && proveedores.find(p => p.id === id)?.name) || 'Sin proveedor',
    [proveedores],
  );

  // Providers State
  const [selectedProveedorId, setSelectedProveedorId] = React.useState<string>('all');
  const proveedorSeleccionado = proveedores.find(proveedor => proveedor.id === selectedProveedorId);

  /**
   * Filtro «Por revisar»: los ingredientes creados al vuelo desde una receta.
   *
   * Sin una forma de listarlos, la marca `pendienteRevision` solo servía para
   * tropezarse con ellos de uno en uno. Esta es la lista de tareas de quien
   * quiera dejar el catálogo limpio.
   */
  const [soloPorRevisar, setSoloPorRevisar] = React.useState(false);
  const totalPorRevisar = React.useMemo(
    () => ingredients.filter(i => (i as any).pendienteRevision).length,
    [ingredients],
  );

  // Combined Filter Logic
  const filteredIngredients = React.useMemo(() => {
    let result = ingredients;

    if (soloPorRevisar) {
      result = result.filter(ing => (ing as any).pendienteRevision);
    }

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

    // C. Búsqueda. El mismo buscador que usa la vista, no un `includes` propio:
    // este panel filtraba OTRA VEZ por su cuenta, así que su versión pobre
    // anulaba la buena —«vodka absolut» pasaba el primer filtro y moría aquí—.
    result = buscar(result, ingredientSearchTerm || '', {
      camposDe: ing => [ing.nombre, ing.categoria],
    });

    return result;
  }, [ingredients, selectedProveedorId, ingredientFilters.category, ingredientSearchTerm, soloPorRevisar]);

  /**
   * Agrupado por identidad, no por parecido.
   *
   * Aquí vivía un emparejador propio que se conformaba con UNA palabra fuerte
   * en común y comparaba cada ficha solo contra el nombre de la primera del
   * grupo —la comprobación transitiva estaba omitida «por rendimiento»—, así
   * que el resultado dependía del orden. Metía en un mismo cajón a
   * «AGUERRIDO, ANTONIO», «AGUERRIDO, BENIGNO» y «AGUERRIDO, TOMAS», que son
   * tres mezcales distintos, y enseñaba uno.
   *
   * Ahora usa la regla que ya estaba aprobada para el detector de duplicados:
   * conjunto IDÉNTICO de palabras fuertes. Ver `core/identity/agruparProductos`.
   */
  const aggregatedProducts = React.useMemo(
    () => agruparProductos(filteredIngredients),
    [filteredIngredients],
  );


  return (
    <div className="lg:h-full flex flex-col bg-transparent border-0 shadow-none w-full max-w-full lg:max-w-[97%] px-1 lg:px-8">
      {/* Unique Integrated Header */}
      <EnLaFranjaFija>
      <div
          className="py-4 flex flex-col gap-4 w-full justify-start"
        >
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
        <div className="flex flex-nowrap items-center gap-2 w-full min-w-0 text-xs relative z-10">

          {/* Los dos selectores comparten una sola capa desplegable: ambos
              paneles ocupan el ancho completo entre sus bordes exteriores. */}
          <div className="relative flex flex-1 min-w-0 gap-2" ref={dropdownRef}>
            <div className="basis-0 flex-1 min-w-0">
              <button
                onClick={() => { setShowCategoryDropdown(v => !v); setShowProveedorDropdown(false); }}
                className="h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm flex items-center gap-2 w-full text-left relative hover:bg-white/80 transition-colors"
              >
                {ingredientFilters.category && ingredientFilters.category !== 'all' ? (
                  <>
                    <div className={`w-2.5 h-2.5 shrink-0 rounded-full ${getCategoryColor(ingredientFilters.category)}`} />
                    <span className="truncate">{ingredientFilters.category}</span>
                  </>
                ) : (
                  <span className="truncate text-slate-500">Categoría</span>
                )}
                <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Solo aparece si hay algo que revisar: un filtro que siempre da
                cero es un botón que estorba. */}
            {totalPorRevisar > 0 && (
              <button
                onClick={() => setSoloPorRevisar(v => !v)}
                title="Ingredientes creados desde una receta, con datos aproximados"
                className={`h-10 shrink-0 px-3 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${soloPorRevisar
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white/50 dark:bg-slate-800/50 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'}`}
              >
                <Icon svg={ICONS.alertCircle} className="w-3.5 h-3.5" />
                {totalPorRevisar}
              </button>
            )}

            <div className="basis-0 flex-1 min-w-0">
              <button
                onClick={() => { setShowProveedorDropdown(v => !v); setShowCategoryDropdown(false); }}
                className="h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm flex items-center gap-2 w-full text-left relative hover:bg-white/80 transition-colors"
              >
                <span className="truncate text-slate-700 dark:text-slate-200">{proveedorSeleccionado?.name || 'Todos los productos'}</span>
                <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </button>
            </div>

            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-2 w-max max-w-full max-h-60 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 p-1">
                <button
                  onClick={() => { onIngredientFilterChange('category', 'all'); setShowCategoryDropdown(false); }}
                  className="w-full whitespace-nowrap text-left px-4 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <span className="text-slate-500">Todas</span>
                </button>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { onIngredientFilterChange('category', cat); setShowCategoryDropdown(false); }}
                    className="w-full whitespace-nowrap text-left px-4 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <div className={`w-2.5 h-2.5 shrink-0 rounded-full ${getCategoryColor(cat)}`} />
                    <span className="truncate">{cat}</span>
                  </button>
                ))}
              </div>
            )}

            {showProveedorDropdown && (
              <div className="absolute top-full right-0 mt-2 inline-flex w-max max-w-full max-h-60 flex-col items-stretch overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 p-1">
                <button
                  onClick={() => { setSelectedProveedorId('all'); setShowProveedorDropdown(false); }}
                  className="whitespace-nowrap text-right px-4 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Todos los productos
                </button>
                {proveedores.map(prov => (
                  <button
                    key={prov.id}
                    onClick={() => { setSelectedProveedorId(prov.id); setShowProveedorDropdown(false); }}
                    className="whitespace-nowrap text-right px-4 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {prov.name}
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Small Actions */}
          <div className="flex shrink-0 gap-1 items-center">
            <Button variant="outline" size="icon" onClick={onImportCSV} title="Importar CSV" className="border-slate-200 dark:border-slate-700 h-10 w-10">
              <Icon svg={ICONS.upload} className="w-4 h-4" />
            </Button>
            {selectedIngredientIds.length > 0 && (
              <>
                {/* BULK BUY BUTTON */}
                {onBulkBuy && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onBulkBuy}
                    title={`Comprar ${selectedIngredientIds.length} ingrediente(s)`}
                    className="h-10 w-10 !bg-emerald-50 !text-emerald-700 border border-emerald-200 hover:!bg-emerald-600 hover:!text-white hover:border-emerald-600 transition-colors"
                  >
                    <Icon svg={ICONS.shoppingCart} className="w-4 h-4" />
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
      </EnLaFranjaFija>

      {/* List Body */}
      <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar p-0 w-full z-0">
        {aggregatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
            <Icon svg={ICONS.flask} className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">No hay ingredientes</p>
          </div>
        ) : (
          // Container-width aware grid: cards never squeeze below 250px, so opening the
          // sidebar reflows the columns instead of truncating the product names.
          <div
            className="grid gap-2 lg:gap-4 pb-20"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
          >
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

              const oferta = opcionesDelGrupo(group.entries);
              const abierto = grupoAbierto === group.id;

              const isSelected = selectedIngredientIds.includes(ing.id);
              const isViewing = viewingIngredientId === ing.id;
              const categoryColor = getCategoryColor(ing.categoria || 'General');

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
                  <div className="flex items-start p-2.5 lg:p-4 relative z-10 gap-2 lg:gap-3 h-full">
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
                          {oferta.opciones.length > 1 && (
                            <button
                              type="button"
                              // El clic no debe seleccionar la ficha: abrir las
                              // opciones es mirar, no elegir.
                              onClick={(e) => { e.stopPropagation(); setGrupoAbierto(abierto ? null : group.id); }}
                              aria-expanded={abierto}
                              className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold inline-flex items-center gap-1 border transition-colors ${abierto
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}
                            >
                              <Icon svg={ICONS.users} className="w-2.5 h-2.5" /> {oferta.opciones.length} opc.
                              <Icon svg={ICONS.chevronDown} className={`w-2.5 h-2.5 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                          {/* Nacido del alta exprés de una receta: datos aproximados.
                              Sin esta marca, un precio estimado se confundiría con
                              catálogo real en la pantalla donde se decide comprar. */}
                          {group.entries.some(e => (e as any).pendienteRevision) && (
                            <span
                              title="Creado desde una receta con datos aproximados. Complétalo cuando puedas."
                              className="px-1.5 py-0.5 rounded-[4px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold tracking-tight uppercase inline-flex items-center gap-1 border border-amber-200 dark:border-amber-800/40"
                            >
                              <Icon svg={ICONS.alertCircle} className="w-2.5 h-2.5" /> POR REVISAR
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Las opciones de compra del grupo. Antes la insignia solo
                          decía cuántas había; para verlas tocaba abrir la ficha de
                          una de ellas y las demás no aparecían por ningún lado. */}
                      {abierto && (
                        <div className="mt-2 rounded-xl border border-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-900/10 divide-y divide-emerald-500/15" onClick={(e) => e.stopPropagation()}>
                          {oferta.opciones.map((op, i) => {
                            const manda = oferta.elegida
                              && op.fichaId === oferta.elegida.fichaId
                              && op.proveedorId === oferta.elegida.proveedorId;
                            return (
                              <div key={`${op.fichaId}-${op.proveedorId}-${i}`} className="flex items-center gap-2 px-2.5 py-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                      {nombreProveedor(op.proveedorId)}
                                    </span>
                                    {manda && (
                                      <span className="shrink-0 px-1 py-px rounded bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider">
                                        {oferta.motivo === 'preferente' ? 'Preferente' : 'Mejor precio'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">{op.fichaNombre}</div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">€{op.precio.toFixed(2)}</div>
                                  <div className="text-[9px] text-slate-400">{op.formato}</div>
                                </div>
                              </div>
                            );
                          })}

                          {oferta.motivo === 'sin-comparar' && (
                            <p className="px-2.5 py-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-400">
                              Estos formatos no se pueden comparar entre sí, así que no se
                              señala ninguno como el más barato: decirlo mal sería peor que
                              no decirlo. Confirma sus formatos en «Revisar Unidades».
                            </p>
                          )}
                          {oferta.alternativaMasBarata && (
                            <p className="px-2.5 py-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-400">
                              Manda tu proveedor preferente. Hay otro más barato:
                              {' '}<strong>{nombreProveedor(oferta.alternativaMasBarata.opcion.proveedorId)}</strong>.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Bottom: Signal Engine Output (Moved here for space) */}
                      {(() => {
                        const supplierMap: Record<string, any> = {};
                        group.entries.forEach((entry, idx) => {
                          // Los ingredientes creados al vuelo quedan fuera del motor de
                          // señales: su precio es una estimación, y alimentar con él una
                          // alerta de «ahorro» o de «subida de precio» produciría avisos
                          // basados en un número que nadie ha comprobado.
                          if ((entry as any).pendienteRevision) return;
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
                            name: group.nombre,
                            category: group.categoria,
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
                          <div className="hidden lg:flex flex-wrap gap-1 mt-1">
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
                    {/* Capped width so a long format label can never squeeze the product name */}
                    <div className="w-auto max-w-[80px] lg:max-w-[92px] flex flex-col items-end justify-between h-full gap-1 lg:gap-2 shrink-0 pl-2 border-l border-slate-100 dark:border-slate-800/50 min-h-[60px]">
                      <div className="text-right w-full">
                        <div className={`font-bold font-mono text-base lg:text-lg leading-none mb-1 ${isViewing ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {ing.precioCompra && ing.precioCompra > 0 ? (
                            <>€{ing.precioCompra.toFixed(2)}</>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">--</span>
                          )}
                        </div>
                        <div
                          className={`text-[9px] uppercase tracking-wider font-medium text-right w-full truncate ${isViewing ? 'text-emerald-200' : 'text-slate-400'}`}
                          title={ing.unidadCompra || ing.unidad || 'Und'}
                        >
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
