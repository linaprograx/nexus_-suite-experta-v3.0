import { createPortal } from 'react-dom';
import React from 'react';
import { Recipe, Ingredient } from '../../types';
import { calculateRecipeCost } from '../../core/costing/costCalculator';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EnLaFranjaFija } from '../layout/FranjaFija';
import { calculateRecipeProfitability } from '../../core/costing/profitabilityEngine';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useUI } from '../../context/UIContext';

// Simple utility for class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface RecipeListProps {
  recipes: Recipe[];
  selectedRecipeId: string | null;
  onSelectRecipe: (recipe: Recipe) => void;
  onAddRecipe: () => void;
  onDragStart?: (e: React.DragEvent, recipe: Recipe) => void;

  // Toolbar Props
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  availableCategories: string[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onDelete: () => void;

  // Bulk Selection Props
  selectedRecipeIds: string[];
  onToggleSelection: (id: string, multi?: boolean) => void;
  onSelectAll: (select: boolean) => void;
  onDeleteSelected: () => void;
  onImport: () => void;
  isLoading?: boolean;
  allIngredients: Ingredient[]; // Add this
}

// Skeleton Component
const RecipeCardSkeleton = () => (
  <div className="w-full relative aspect-[4/5] rounded-2xl bg-slate-200 dark:bg-slate-800/60 overflow-hidden animate-pulse">
    <div className="absolute inset-x-0 bottom-0 p-3.5 space-y-2">
      <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700/50 rounded-full" />
      <div className="h-4 w-3/4 bg-slate-300 dark:bg-slate-700/50 rounded" />
      <div className="flex justify-between pt-2">
        <div className="h-5 w-12 bg-slate-300 dark:bg-slate-700/50 rounded" />
        <div className="h-5 w-12 bg-slate-300 dark:bg-slate-700/50 rounded" />
      </div>
    </div>
  </div>
);

// Memoized Recipe Card
const RecipeCard = React.memo(({
  recipe,
  isViewing,
  isSelected,
  onSelect,
  onToggleSelection,
  onDragStart,
  allIngredients,
  allRecipes = []
}: {
  recipe: Recipe,
  isViewing: boolean,
  isSelected: boolean,
  onSelect: (r: Recipe) => void,
  onToggleSelection: (id: string) => void,
  onDragStart?: (e: React.DragEvent, recipe: Recipe) => void,
  allIngredients: Ingredient[],
  allRecipes?: Recipe[]
}) => {
  const mainCategory = recipe.categorias?.[0] || 'General';
  const isDone = recipe.categorias?.includes('Carta') || recipe.categorias?.includes('Terminado');

  // Calculate cost dynamically to ensure consistency with Detail Panel (incl. sub-recipes)
  const costData = React.useMemo(() => {
    return calculateRecipeCost(recipe, allIngredients, undefined, allRecipes);
  }, [recipe, allIngredients, allRecipes]);

  const displayCost = costData?.costoTotal || recipe.costoTotal || recipe.costoReceta || 0;

  return (
    <div className="w-full relative group">
      <div
        onClick={() => onSelect(recipe)}
        draggable={!!onDragStart}
        onDragStart={(e) => onDragStart && onDragStart(e, recipe)}
        className={cn(
          "relative aspect-[4/5] rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden",
          "hover:-translate-y-1 hover:shadow-xl",
          isViewing
            ? "ring-2 ring-teal-400 shadow-xl shadow-teal-900/30 z-10"
            : "shadow-md ring-1 ring-black/5 dark:ring-white/5"
        )}
      >
        {/* Full-bleed image or gradient placeholder */}
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.nombre}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center">
            <span className="text-white font-black text-5xl opacity-40 tracking-tight">{recipe.nombre.substring(0, 2).toUpperCase()}</span>
          </div>
        )}

        {/* Readability gradient over the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

        {/* Checkbox */}
        <div
          className="absolute top-2.5 right-2.5 z-20"
          onClick={(e) => { e.stopPropagation(); onToggleSelection(recipe.id); }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className={cn(
              "w-5 h-5 rounded border-2 border-white/70 bg-black/20 backdrop-blur-sm text-teal-500 transition-all cursor-pointer",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          />
        </div>

        {/* Content overlaid at the bottom */}
        <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
          <div className="flex flex-wrap gap-1 mb-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-wide bg-white/20 backdrop-blur-sm border border-white/10">
              {mainCategory}
            </span>
            {isDone && (
              <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-wide bg-emerald-500/40 text-emerald-50 border border-emerald-300/20">Carta</span>
            )}
          </div>
          <p className="font-black text-lg leading-tight tracking-tight line-clamp-2 drop-shadow-md">{recipe.nombre}</p>

          <div className="flex items-end justify-between mt-2.5 pt-2.5 border-t border-white/15">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/60 block leading-none mb-0.5">Costo</span>
              <span className="font-bold font-mono text-sm">€{displayCost.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-white/60 block leading-none mb-0.5">Venta</span>
              <span className="font-bold font-mono text-sm text-emerald-300">{recipe.precioVenta ? `€${recipe.precioVenta.toFixed(2)}` : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Botón cuadrado con menú, al estilo de la barra del Finder.
 *
 * Los tres modificadores —categoría, estado y orden— ocupaban con sus
 * desplegables casi dos líneas enteras en un móvil, y dejaban fuera a importar,
 * crear y eliminar. Reducidos a un icono cada uno, la barra cabe en una sola
 * línea y el valor elegido se sigue viendo: el botón se marca y muestra un punto
 * cuando no está en su valor por defecto.
 *
 * El menú se pinta en un portal anclado al botón, no dentro de la barra, para
 * que no la ensanche ni quede recortado por el desbordamiento del contenedor.
 */
const BotonMenu: React.FC<{
    icono: string;
    etiqueta: string;
    valor: string;
    porDefecto: string;
    opciones: { id: string; etiqueta: string }[];
    onChange: (id: string) => void;
}> = ({ icono, etiqueta, valor, porDefecto, opciones, onChange }) => {
    const [abierto, setAbierto] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
    const activo = valor !== porDefecto;

    const abrir = () => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        // Se acota al viewport para que un botón cerca del borde derecho no
        // saque el menú fuera de la pantalla.
        const ANCHO = 208;
        setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - ANCHO - 8)) });
        setAbierto(true);
    };

    React.useEffect(() => {
        if (!abierto) return;
        const fuera = (e: Event) => {
            const t = e.target as HTMLElement;
            if (!ref.current?.contains(t) && !t.closest?.('[data-menu-filtro]')) setAbierto(false);
        };
        document.addEventListener('pointerdown', fuera);
        return () => document.removeEventListener('pointerdown', fuera);
    }, [abierto]);

    const actual = opciones.find(o => o.id === valor);

    return (
        <div ref={ref} className="relative flex-1 min-w-0">
            <button
                type="button"
                onClick={() => (abierto ? setAbierto(false) : abrir())}
                aria-label={`${etiqueta}: ${actual?.etiqueta || 'todas'}`}
                title={`${etiqueta} · ${actual?.etiqueta || ''}`}
                aria-expanded={abierto}
                // El relleno verde queda reservado al botón de crear receta, que
                // es la única acción principal de la barra. Aquí el estado activo
                // se marca con borde y color de icono: se distingue igual sin
                // competir visualmente con la acción que sí debe destacar.
                className={`relative w-full h-10 rounded-xl flex items-center justify-center border transition-colors ${activo
                    ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
                <Icon svg={icono} className="w-4 h-4" />
                {activo && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500" />}
            </button>

            {abierto && pos && createPortal(
                <div
                    data-menu-filtro
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: 208, zIndex: 9999 }}
                    className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
                >
                    <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {etiqueta}
                    </p>
                    {opciones.map(o => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => { onChange(o.id); setAbierto(false); }}
                            className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 ${o.id === valor
                                ? 'text-teal-600 dark:text-teal-400 font-bold'
                                : 'text-slate-700 dark:text-slate-200'}`}
                        >
                            <span className="min-w-0 break-words">{o.etiqueta}</span>
                            {o.id === valor && <Icon svg={ICONS.check} className="w-4 h-4 shrink-0" />}
                        </button>
                    ))}
                </div>,
                document.body,
            )}
        </div>
    );
};

/**
 * Criterios de ordenación del catálogo.
 *
 * Ordenar **no es filtrar**: esto solo cambia la secuencia, nunca qué se ve. Se
 * mantienen separados a propósito para que añadir filtros más adelante no toque
 * nada de aquí.
 *
 * El coste y el margen salen del motor de rentabilidad, no de campos guardados
 * en la receta: esos pueden estar desactualizados si cambió el precio de un
 * ingrediente, y ordenar por un número obsoleto es peor que no ordenar.
 */
export type CriterioOrden =
    | 'recientes' | 'antiguas' | 'az' | 'za'
    | 'coste-asc' | 'coste-desc' | 'precio-asc' | 'precio-desc'
    | 'margen-desc' | 'margen-asc';

const OPCIONES_ORDEN: { id: CriterioOrden; etiqueta: string }[] = [
    { id: 'recientes', etiqueta: 'Más recientes' },
    { id: 'antiguas', etiqueta: 'Más antiguas' },
    { id: 'az', etiqueta: 'A → Z' },
    { id: 'za', etiqueta: 'Z → A' },
    { id: 'coste-asc', etiqueta: 'Menor coste' },
    { id: 'coste-desc', etiqueta: 'Mayor coste' },
    { id: 'precio-asc', etiqueta: 'Menor precio' },
    { id: 'precio-desc', etiqueta: 'Mayor precio' },
    { id: 'margen-desc', etiqueta: 'Mayor margen' },
    { id: 'margen-asc', etiqueta: 'Menor margen' },
];

/** Fecha comparable. Sin `createdAt` cae a `updatedAt`, y si no, a 0. */
const fechaDe = (r: any): number => {
    const v = r?.createdAt ?? r?.updatedAt;
    if (!v) return 0;
    if (typeof v?.toDate === 'function') return v.toDate().getTime();
    const t = new Date(v).getTime();
    return isNaN(t) ? 0 : t;
};

/**
 * A qué grupo del catálogo pertenece una receta.
 *
 * Se deduce de `categorias`, que es donde el proyecto ya guardaba esta
 * distinción: no se añade ningún campo nuevo ni se migra nada.
 */
const grupoDeReceta = (r: any): 'garnish' | 'subreceta' | 'receta' => {
    const cats: string[] = r?.categorias || [];
    if (cats.includes('Garnish')) return 'garnish';
    if (cats.includes('Preparacion')) return 'subreceta';
    return 'receta';
};

/** Orden de aparición: primero lo que se vende, después lo que lo compone. */
const GRUPOS_CATALOGO = [
    { id: 'receta' as const, titulo: 'Recetas' },
    { id: 'subreceta' as const, titulo: 'Sub-recetas' },
    { id: 'garnish' as const, titulo: 'Garnish' },
];

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  selectedRecipeId, // Viewing
  onSelectRecipe, // Viewing
  onAddRecipe,
  onDragStart,

  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedStatus,
  onStatusChange,

  selectedRecipeIds = [],
  onToggleSelection,
  onSelectAll,
  onDeleteSelected,
  onImport,
  isLoading = false,
  allIngredients // Destructure
}) => {
  const { compactMode } = useUI();

  // Deduplicate recipes
  const [orden, setOrden] = React.useState<CriterioOrden>('recientes');

  const uniqueRecipes = React.useMemo(() => {
    if (!recipes) return [];
    const seen = new Set();
    const sinDuplicados = recipes.filter(r => {
      const duplicate = seen.has(r.id);
      seen.add(r.id);
      return !duplicate;
    });

    // El coste y el margen se calculan una vez por receta, no dentro del
    // comparador: un `sort` llama al comparador O(n log n) veces y recalcular
    // ahí el escandallo de cada receta sería carísimo con el catálogo grande.
    const metricas = new Map<string, { coste: number; precio: number; margen: number }>();
    if (orden.startsWith('coste') || orden.startsWith('precio') || orden.startsWith('margen')) {
      for (const r of sinDuplicados) {
        const p = calculateRecipeProfitability({ recipe: r, allIngredients, allRecipes: sinDuplicados });
        metricas.set(r.id, { coste: p.realServedCost, precio: p.precioVenta, margen: p.grossMarginPercentage });
      }
    }
    const m = (r: any) => metricas.get(r.id) || { coste: 0, precio: 0, margen: 0 };
    const nombre = (r: any) => (r?.nombre || '').toLocaleLowerCase('es');

    const copia = [...sinDuplicados];
    switch (orden) {
      case 'recientes': return copia.sort((a, b) => fechaDe(b) - fechaDe(a) || nombre(a).localeCompare(nombre(b)));
      case 'antiguas': return copia.sort((a, b) => fechaDe(a) - fechaDe(b) || nombre(a).localeCompare(nombre(b)));
      case 'az': return copia.sort((a, b) => nombre(a).localeCompare(nombre(b)));
      case 'za': return copia.sort((a, b) => nombre(b).localeCompare(nombre(a)));
      case 'coste-asc': return copia.sort((a, b) => m(a).coste - m(b).coste);
      case 'coste-desc': return copia.sort((a, b) => m(b).coste - m(a).coste);
      case 'precio-asc': return copia.sort((a, b) => m(a).precio - m(b).precio);
      case 'precio-desc': return copia.sort((a, b) => m(b).precio - m(a).precio);
      case 'margen-desc': return copia.sort((a, b) => m(b).margen - m(a).margen);
      case 'margen-asc': return copia.sort((a, b) => m(a).margen - m(b).margen);
      default: return copia;
    }
  }, [recipes, orden, allIngredients]);

  return (
    <div className="lg:h-full flex flex-col w-full max-w-full">
      {/* Toolbar Header */}
      <EnLaFranjaFija>
      <div
          className="py-4 flex flex-col gap-4 w-full"
        >
        {/* Search Bar - Full Width */}
        <div className="relative w-full group">
          <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o ingrediente..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>

        {/* Barra de acciones — una sola línea.
            Los tres modificadores son botones cuadrados con menú; el resto de
            acciones queda a la derecha. */}
        <div className="flex items-center gap-2 w-full">
          {/* Los tres reparten a partes iguales el espacio libre; el resto de la
              barra conserva su tamaño. */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
          <BotonMenu
            icono={ICONS.tag}
            etiqueta="Categoría"
            valor={selectedCategory}
            porDefecto="all"
            opciones={[
              { id: 'all', etiqueta: 'Todas las categorías' },
              ...Array.from(new Set(availableCategories)).map(c => ({ id: c, etiqueta: c })),
            ]}
            onChange={onCategoryChange}
          />

          <BotonMenu
            icono={ICONS.flag}
            etiqueta="Estado"
            valor={selectedStatus}
            porDefecto="all"
            opciones={[
              { id: 'all', etiqueta: 'Todos los estados' },
              { id: 'Idea', etiqueta: 'Idea' },
              { id: 'Pruebas', etiqueta: 'Pruebas' },
              { id: 'Terminado', etiqueta: 'Carta' },
              { id: 'Archivada', etiqueta: 'Archivada' },
            ]}
            onChange={onStatusChange}
          />

          {/* Ordenar va aparte de los filtros a propósito: cambia la secuencia,
              nunca qué se ve. */}
          <BotonMenu
            icono={ICONS.sliders}
            etiqueta="Ordenar por"
            valor={orden}
            porDefecto="recientes"
            opciones={OPCIONES_ORDEN.map(o => ({ id: o.id, etiqueta: o.etiqueta }))}
            onChange={(v) => setOrden(v as CriterioOrden)}
          />
          </div>

          {/* Delete Selected Button */}
          {selectedRecipeIds.length > 0 && (
            <Button
              variant="destructive"
              className="h-10 px-4 whitespace-nowrap"
              onClick={onDeleteSelected}
              title="Eliminar seleccionadas"
            >
              <Icon svg={ICONS.trash} className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">({selectedRecipeIds.length})</span>
            </Button>
          )}

          {/* Acciones, siempre a la derecha. `ml-auto` aquí y no en el botón de
              borrar, que solo existe cuando hay selección. */}
          <div className="ml-auto flex items-center gap-2">
          {/* Import Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onImport}
            className="h-10 w-10 text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20"
            title="Importar Receta"
          >
            <Icon svg={ICONS.upload} className="w-4 h-4" />
          </Button>

          {/* NEW RECIPE BUTTON — brand gradient, prominent */}
          <button
            onClick={onAddRecipe}
            className="group flex items-center gap-2 h-10 pl-3 pr-4 ml-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
            title="Nueva Receta"
          >
            <Icon svg={ICONS.plus} className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline">Nueva</span>
          </button>
          </div>
        </div>
      </div>
      </EnLaFranjaFija>

      {/* List Header (Actions) */}
      <div className="px-1 py-2 flex items-center justify-between text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={uniqueRecipes.length > 0 && selectedRecipeIds.length === uniqueRecipes.length}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Seleccionar todo</span>
        </div>
        <span className="italic">{isLoading ? 'Cargando...' : `${uniqueRecipes.length} recetas`}</span>
      </div>

      {/* El scroll interno solo en escritorio. En móvil scrollea la página: un
          contenedor de scroll intermedio se convierte en el ancla del `sticky`
          de la barra de filtros y, como nunca llega a scrollear, el `sticky`
          no se activaba. Es la regla que ya seguían los otros dos paneles. */}
      <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar p-0 w-full">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 px-0.5 pb-20">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : uniqueRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Icon svg={ICONS.book} className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No se encontraron recetas</p>
            <p className="text-sm text-slate-400 mt-1">Intenta con otros filtros o crea una nueva</p>
          </div>
        ) : (
          <div className="pb-20">
            {/* Tres grupos, un solo listado.
                Sub-recetas y garnish compartían rejilla con los cócteles y no
                había forma de saber qué se estaba mirando. Se separan por
                jerarquía —un encabezado tenue y aire— sin cajas ni bordes: el
                lenguaje visual de las tarjetas no cambia. Un grupo vacío no
                aparece, así que quien no usa sub-recetas no ve nada nuevo. */}
            {GRUPOS_CATALOGO.map(grupo => {
              const delGrupo = uniqueRecipes.filter(r => grupoDeReceta(r) === grupo.id);
              if (delGrupo.length === 0) return null;
              const unico = delGrupo.length === uniqueRecipes.length;
              return (
                <section key={grupo.id} className={unico ? '' : 'mb-6 last:mb-0'}>
                  {!unico && (
                    <div className="flex items-baseline gap-2 px-1 mb-2.5">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {grupo.titulo}
                      </h3>
                      <span className="text-[11px] text-slate-300 dark:text-slate-600 tabular-nums">
                        {delGrupo.length}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 px-0.5">
                    {delGrupo.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        isViewing={selectedRecipeId === recipe.id}
                        isSelected={selectedRecipeIds.includes(recipe.id)}
                        onSelect={onSelectRecipe}
                        onToggleSelection={onToggleSelection}
                        onDragStart={onDragStart}
                        allIngredients={allIngredients} // Pass it down
                        allRecipes={recipes}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div >
  );
};
