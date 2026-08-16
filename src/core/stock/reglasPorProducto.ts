import { Ingredient, StockRule } from '../../types';
import { indicePorId, resolverMaestro } from '../identity/masterProduct';

/**
 * Cruza reglas de stock con existencias **resolviendo el producto maestro**.
 *
 * ## El fallo que arregla, medido en producción el 2026-08-16
 *
 * `buildCurrentStock` consolida las existencias en el maestro —recibe
 * `resolverMaestro` desde `GrimoriumView` y desde el Dashboard— pero el cruce
 * con las reglas se hacía por el id crudo:
 *
 *     stockItems.find(i => i.ingredientId === rule.ingredientId)
 *
 * Así que una regla escrita sobre una ficha que después se fusionó buscaba las
 * existencias de un id que ya no tiene ninguna: encontraba **cero**.
 *
 * En el catálogo del fundador eso ya estaba pasando. AGUERRIDO, BENIGNO
 * CUPREATA CAPON aparecía en «STOCK CRÍTICO (1)» con **0 Und** y un «→ Pedir 1»,
 * mientras su propia ficha declaraba **3 und**. La alerta pedía comprar un
 * producto que estaba lleno, y llevaba ahí desde que se fusionó el grupo.
 *
 * No era un fallo de la fusión: la fusión hizo lo que prometía y no borró nada.
 * Era que **la mitad de la app resolvía el alias y la otra mitad no**.
 *
 * ## La regla
 *
 * Un solo sitio construye este índice, y por eso está aquí y no repetido en
 * cuatro pantallas. Sin alias en el catálogo, `resolverMaestro` devuelve el
 * mismo id que recibe y el resultado es idéntico al de antes.
 *
 * Si dos alias del mismo maestro tuvieran regla, gana la primera y se ignora la
 * segunda: son dos reglas para un solo producto, y elegir en silencio la más
 * estricta escondería que hay una duplicada que alguien debería retirar.
 */
export const reglasPorMaestro = (
    reglas: StockRule[],
    ingredientes: Ingredient[],
): Map<string, StockRule> => {
    const porId = indicePorId(ingredientes || []);
    const m = new Map<string, StockRule>();
    for (const r of reglas || []) {
        if (!r?.ingredientId) continue;
        const maestro = resolverMaestro(r.ingredientId, porId);
        if (!m.has(maestro)) m.set(maestro, r);
    }
    return m;
};

/**
 * El id maestro de una regla. Para cuando hace falta ir en la otra dirección:
 * de la regla a las existencias, no de las existencias a la regla.
 */
export const maestroDeRegla = (
    regla: StockRule,
    ingredientes: Ingredient[],
): string => resolverMaestro(regla.ingredientId, indicePorId(ingredientes || []));
