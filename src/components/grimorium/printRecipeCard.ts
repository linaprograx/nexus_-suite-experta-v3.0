import { Recipe } from '../../types';
import type { RecipeCostResult } from '../../core/costing/costCalculator';

const esc = (s: any): string =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const money = (n: number) => `€${(isNaN(n) ? 0 : n).toFixed(2)}`;

/**
 * Opens a clean, self-contained print window with a standardized recipe card
 * (ficha técnica). Kept out of the app's DOM so print CSS never leaks.
 */
export function printRecipeCard(recipe: Partial<Recipe>, cost: RecipeCostResult, allRecipes: Recipe[] = []): void {
    const porciones = (recipe.porciones && recipe.porciones > 0) ? recipe.porciones : 1;
    const costoTotal = cost?.costoTotal || 0;
    const venta = recipe.precioVenta || 0;
    const margen = venta > 0 ? ((venta - costoTotal) / venta) * 100 : 0;

    const specs = [
        ['Técnica', recipe.technique],
        ['Cristalería', recipe.glassware],
        ['Hielo', recipe.ice],
        ['Garnish', recipe.garnish],
        ['ABV', recipe.abv != null ? `${recipe.abv}%` : ''],
        ['Rinde', porciones > 1 ? `${porciones} porciones` : ''],
    ].filter(([, v]) => v);

    const lines = (cost?.costoPorIngrediente || []) as any[];
    // Every line renders with the SAME three-column grid (name | qty | cost).
    // Composite lines (sub-recipe / garnish) add indented component rows that keep
    // the exact same column alignment.
    const rowsHtml = lines.map(li => {
        const isGarnish = !!li.isGarnish;
        const isComposite = li.isSubRecipe || isGarnish || li.subItems || li.subRecipeId;
        // Inline composite uses subItems; a linked one resolves to the referenced recipe's ingredients
        const subList: any[] = li.subItems && li.subItems.length
            ? li.subItems
            : (li.subRecipeId ? ((allRecipes.find(r => r.id === li.subRecipeId)?.ingredientes as any[]) || []) : []);

        const kindClass = isGarnish ? 'k-garnish' : isComposite ? 'k-sub' : 'k-ing';
        const parent = `
          <tr class="line ${kindClass}">
            <td class="name"><span class="dot"></span>${esc(li.nombre || '—')}${isComposite ? `<span class="tag">${isGarnish ? 'garnish' : 'sub-receta'}</span>` : ''}</td>
            <td class="num">${esc(li.cantidad || 0)} ${esc(li.unidad || '')}</td>
            <td class="num">${money(li.costo || 0)}</td>
          </tr>`;

        const children = isComposite
            ? subList.map((si: any) => `
          <tr class="subrow ${kindClass}">
            <td class="name"><span class="branch"></span>${esc(si.nombre || 'Ingrediente')}</td>
            <td class="num">${esc(si.cantidad || 0)} ${esc(si.unidad || '')}</td>
            <td class="num"></td>
          </tr>`).join('')
            : '';

        return parent + children;
    }).join('');

    const specsHtml = specs.map(([k, v]) =>
        `<div class="spec"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`
    ).join('');

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(recipe.nombre || 'Receta')} — Ficha técnica</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; margin: 0; padding: 32px; }
  .head { display: flex; gap: 26px; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 22px; }
  .head img { width: 170px; height: 170px; object-fit: cover; border-radius: 18px; box-shadow: 0 8px 24px rgba(15,23,42,.16); flex-shrink: 0; }
  h1 { font-size: 34px; margin: 0 0 6px; letter-spacing: -.02em; }
  .cat { color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; }
  .specs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
  .spec { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; }
  .spec .k { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; font-weight: 700; }
  .spec .v { font-size: 14px; font-weight: 500; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #0d9488; margin: 20px 0 8px; }
  /* One grid for every row: name | qty | cost — identical alignment across all kinds */
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  col.c-name { width: auto; } col.c-qty { width: 130px; } col.c-cost { width: 110px; }
  th { text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; border-bottom: 1px solid #e2e8f0; }
  th.num, td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  td { padding: 8px; font-size: 13px; vertical-align: middle; }
  tr.line > td { border-bottom: 1px solid #f1f5f9; }
  tr.line + tr.subrow > td { border-top: 0; }
  td.name { position: relative; padding-left: 20px; }
  /* Colored marker identifies the kind without changing the row's shape */
  .dot { position: absolute; left: 6px; top: 50%; transform: translateY(-50%); width: 7px; height: 7px; border-radius: 50%; background: #14b8a6; }
  .k-sub .dot { background: #8b5cf6; }
  .k-garnish .dot { background: #f59e0b; }
  .tag { margin-left: 8px; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 999px; padding: 1px 7px; vertical-align: middle; }
  tr.subrow td { padding-top: 2px; padding-bottom: 2px; font-size: 11.5px; color: #64748b; border-bottom: 0; }
  tr.subrow td.name { padding-left: 34px; }
  .branch { position: absolute; left: 18px; top: 0; bottom: 0; width: 2px; background: #e2e8f0; }
  .k-sub .branch { background: #ddd6fe; }
  .k-garnish .branch { background: #fde68a; }
  tr.subrow:last-of-type td { padding-bottom: 8px; }
  .prep { font-size: 13px; line-height: 1.6; white-space: pre-line; background: #f8fafc; border-radius: 8px; padding: 12px 14px; }
  .totals { display: flex; gap: 24px; margin-top: 22px; border-top: 2px solid #e2e8f0; padding-top: 14px; }
  .totals .box .l { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; font-weight: 700; }
  .totals .box .n { font-size: 20px; font-weight: 800; }
  .foot { margin-top: 28px; font-size: 10px; color: #cbd5e1; }
  @media print { body { padding: 12mm; } .noprint { display: none; } }
</style></head><body>
  <div class="head">
    ${recipe.imageUrl ? `<img src="${esc(recipe.imageUrl)}" alt="">` : ''}
    <div>
      <h1>${esc(recipe.nombre || 'Receta sin nombre')}</h1>
      <div class="cat">${esc((recipe.categorias || []).join(' · '))}</div>
    </div>
  </div>

  ${specsHtml ? `<div class="specs">${specsHtml}</div>` : ''}

  <h2>Ingredientes</h2>
  <table>
    <colgroup><col class="c-name"><col class="c-qty"><col class="c-cost"></colgroup>
    <thead><tr><th>Ingrediente</th><th class="num">Cantidad</th><th class="num">Coste</th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="3">Sin ingredientes</td></tr>'}</tbody>
  </table>

  ${recipe.preparacion ? `<h2>Preparación</h2><div class="prep">${esc(recipe.preparacion)}</div>` : ''}

  <div class="totals">
    <div class="box"><div class="l">Coste total</div><div class="n">${money(costoTotal)}</div></div>
    ${porciones > 1 ? `<div class="box"><div class="l">Coste / porción</div><div class="n">${money(costoTotal / porciones)}</div></div>` : ''}
    <div class="box"><div class="l">Precio venta</div><div class="n">${money(venta)}</div></div>
    <div class="box"><div class="l">Margen</div><div class="n">${margen.toFixed(0)}%</div></div>
  </div>

  <div class="foot">Ficha generada por Nexus Suite · Grimorio — ${new Date().toLocaleDateString('es-ES')}</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=840,height=1000');
    if (!w) { alert('Permite las ventanas emergentes para imprimir la ficha.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
}
