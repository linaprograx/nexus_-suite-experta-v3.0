/**
 * Vocabulario de palabras que describen **familia, tipo o variedad**, no un
 * producto concreto. **Fuente única.**
 *
 * Estaba copiado en cuatro sitios que fueron divergiendo —`MarketSidebar`,
 * `IngredientListPanel`, `IngredientDetailPanel` y el detector de duplicados—
 * y a ninguno le habían añadido `mezcal` ni las variedades de agave. El
 * resultado, visto en producción: la ficha de *AGUERRIDO, ANTONIO CUPREATA*
 * ofrecía como **«mejor precio»** un *TEQUILA CURADO CUPREATA* a 32,20 €,
 * porque compartían la palabra `cupreata`, que es una variedad de agave y no
 * un producto.
 *
 * Compartir familia o variedad **nunca** es evidencia de ser el mismo producto.
 *
 * Lo que NO entra aquí, a propósito: `reposado`, `añejo`, `blanco`, `joven`,
 * `plata`. Esas sí distinguen referencias distintas de la misma marca, y
 * debilitarlas nos haría perder una señal de identidad legítima.
 */
export const TOKENS_GENERICOS: ReadonlySet<string> = new Set([
    // Destilados y familias
    'licor', 'licores', 'vodka', 'whisky', 'whiskey', 'bourbon', 'ron', 'rum',
    'ginebra', 'gin', 'tequila', 'mezcal', 'mezcales', 'raicilla', 'sotol',
    'pisco', 'cachaza', 'cachaca', 'brandy', 'conac', 'cognac', 'armagnac',
    'grappa', 'orujo', 'absenta', 'anis', 'aguardiente', 'destilado', 'destilados',
    'vermut', 'vermouth', 'bitter', 'bitters', 'amaro',
    'vino', 'cava', 'champagne', 'espumoso', 'cerveza', 'sidra', 'sake', 'hidromiel',

    // Variedades de agave y método — describen el origen, no el producto
    'agave', 'cupreata', 'espadin', 'espadín', 'tobala', 'tobalá', 'madrecuixe',
    'tepeztate', 'arroqueno', 'arroqueño', 'jabali', 'jabalí', 'karwinskii',
    'papalote', 'cenizo', 'mexicano', 'capon', 'capón', 'ancestral', 'artesanal',

    // Sin alcohol
    'zumo', 'jugo', 'sirope', 'siropes', 'jarabe', 'pure', 'purés', 'pures',
    'nectar', 'néctar', 'refresco', 'refrescos', 'tonica', 'tónica', 'agua',
    'soda', 'gaseosa', 'concentrado', 'mixer', 'mixers', 'bebida',

    // Despensa
    'cafe', 'café', 'te', 'té', 'infusion', 'infusión', 'leche', 'crema', 'nata',
    'azucar', 'azúcar', 'sal', 'especia', 'especias', 'botanico', 'botánico',
    'botanicos', 'botánicos', 'hierba', 'hierbas', 'hoja', 'hojas', 'flor', 'flores',
    'fruta', 'frutas', 'verdura', 'verduras', 'hortaliza', 'hortalizas',
    'citrico', 'cítrico', 'citricos', 'cítricos', 'brote', 'brotes',
]);

export const esTokenGenerico = (token: string): boolean =>
    TOKENS_GENERICOS.has(token);

/**
 * ¿El nombre aporta algo más que su familia?
 *
 * Un producto llamado solo «LICOR» o «MEZCAL CUPREATA» no identifica nada
 * concreto, así que no debe emparejarse con otros por parecido: cualquier
 * coincidencia sería de familia.
 */
export const tieneTokenEspecifico = (tokens: string[]): boolean =>
    tokens.some(t => !TOKENS_GENERICOS.has(t));
