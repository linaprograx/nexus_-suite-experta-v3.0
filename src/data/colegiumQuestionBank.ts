import { QuizQuestion } from '../types';

/**
 * Curated offline question bank for Nexus Colegium.
 * Used as a graceful fallback when the AI Gateway is unavailable, so the
 * academy is always playable. Questions are factually verified cocktail
 * knowledge with didactic explanations.
 *
 * Each question stores options in a fixed order with `correctAnswerIndex`;
 * the consumer shuffles options at runtime.
 */

type Bank = Record<string, QuizQuestion[]>;

const BANK: Bank = {
    Fundamentos: [
        {
            question: '¿Cuáles son los ingredientes de un Negroni clásico?',
            options: ['Gin, Campari y Vermut rojo', 'Vodka, Triple sec y lima', 'Ron, menta y soda', 'Whisky, azúcar y angostura'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Negroni se construye con partes iguales de gin, Campari y vermut rojo, removido sobre hielo y con piel de naranja.',
        },
        {
            question: '¿Qué técnica se usa para un cóctel con solo ingredientes alcohólicos como el Martini?',
            options: ['Remover (stir)', 'Agitar (shake)', 'Licuar (blend)', 'Macerar (muddle)'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Los cócteles compuestos solo de licores e ingredientes claros se remueven para enfriar sin airear ni enturbiar la mezcla.',
        },
        {
            question: '¿Cuál es la guarnición tradicional de un Negroni?',
            options: ['Piel de naranja', 'Cereza marrasquino', 'Rodaja de pepino', 'Rama de canela'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La piel de naranja aporta aceites cítricos que complementan el amargor del Campari.',
        },
        {
            question: '¿Qué licor base lleva un Daiquiri clásico?',
            options: ['Ron blanco', 'Tequila', 'Gin', 'Brandy'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Daiquiri es ron blanco, zumo de lima y azúcar: el equilibrio fundamental de fuerte, ácido y dulce.',
        },
        {
            question: '¿Qué proporción describe mejor un "sour" clásico?',
            options: ['2 licor : 1 ácido : 1 dulce', '1 licor : 1 ácido : 1 dulce', '3 licor : 1 ácido : 2 dulce', '1 licor : 2 ácido : 1 dulce'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La fórmula sour clásica es 2:1:1 (licor, cítrico, endulzante), base del Whiskey Sour, Daiquiri y Margarita.',
        },
        {
            question: '¿Qué cristalería es la tradicional para servir un Martini?',
            options: ['Copa de cóctel (Martini)', 'Vaso old fashioned', 'Copa Collins', 'Copa coupe de champán'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La copa de cóctel cónica mantiene la bebida fría sin hielo y concentra los aromas hacia la nariz.',
        },
        {
            question: '¿Qué es el "dry shake" en coctelería?',
            options: ['Agitar sin hielo para emulsionar clara de huevo', 'Agitar con hielo seco', 'Remover sin endulzar', 'Servir sin guarnición'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El dry shake (sin hielo) emulsiona la clara de huevo creando una espuma sedosa antes del agitado con hielo.',
        },
        {
            question: '¿Cuál es el ingrediente amargo característico de un Old Fashioned?',
            options: ['Bitter de angostura', 'Campari', 'Fernet', 'Aperol'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Old Fashioned combina whisky, azúcar, agua y unas gotas de angostura, realzando el destilado base.',
        },
    ],

    'Flavor Pairing': [
        {
            question: '¿Qué hierba marida clásicamente con gin y pepino?',
            options: ['Menta', 'Romero', 'Albahaca', 'Tomillo'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La menta y el pepino comparten compuestos frescos y herbáceos que realzan los botánicos del gin.',
        },
        {
            question: '¿Qué cítrico potencia mejor el perfil de un tequila reposado?',
            options: ['Lima', 'Limón amarillo', 'Pomelo rosa', 'Naranja sanguina'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La acidez brillante de la lima corta la untuosidad del agave y es el cítrico clásico del tequila.',
        },
        {
            question: '¿Con qué especia combina especialmente bien el ron añejo?',
            options: ['Canela', 'Eneldo', 'Comino', 'Pimentón'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Las notas cálidas de la canela amplifican el dulzor amelazado y la madera del ron añejo.',
        },
        {
            question: '¿Qué fruta crea un puente clásico entre whisky y notas otoñales?',
            options: ['Manzana', 'Sandía', 'Kiwi', 'Maracuyá'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La manzana aporta acidez y dulzor que conecta con las notas de cereal y barrica del whisky.',
        },
        {
            question: '¿Qué amargo aperitivo combina por contraste con la naranja?',
            options: ['Campari', 'Crema de cacao', 'Licor de avellana', 'Triple seco'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El amargor del Campari equilibra el dulzor cítrico de la naranja: la base del Garibaldi y el Negroni.',
        },
        {
            question: '¿Qué elemento aromático realza un mezcal sin tapar su humo?',
            options: ['Sal de gusano y cítrico', 'Crema de leche', 'Chocolate blanco', 'Vainilla intensa'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La sal y el cítrico subrayan el ahumado del mezcal sin enmascararlo, a diferencia de lácteos o dulces pesados.',
        },
    ],

    'Cata a Ciegas': [
        {
            question: 'Notas de enebro y cítrico seco, herbáceo, muy aromático y transparente. ¿Qué cóctel es?',
            options: ['Gin Tonic', 'Mojito', 'Margarita', 'Manhattan'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El perfil dominado por enebro (gin) con cítrico seco y burbuja describe un Gin Tonic.',
        },
        {
            question: 'Dulzor de melaza, lima fresca, menta intensa y efervescencia. ¿Qué cóctel es?',
            options: ['Mojito', 'Negroni', 'Martini seco', 'Old Fashioned'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Ron, lima, menta, azúcar y soda: el perfil fresco y burbujeante del Mojito.',
        },
        {
            question: 'Amargor intenso, herbáceo, rojo profundo, con cítrico de naranja. ¿Qué cóctel es?',
            options: ['Negroni', 'Daiquiri', 'Cosmopolitan', 'Piña Colada'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El amargor rojo de Campari y vermut con piel de naranja es la firma del Negroni.',
        },
        {
            question: 'Agave herbáceo, lima ácida, toque dulce de naranja y borde salado. ¿Qué cóctel es?',
            options: ['Margarita', 'Manhattan', 'Mojito', 'Aperol Spritz'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Tequila, triple seco y lima con borde de sal definen la Margarita.',
        },
        {
            question: 'Whisky robusto, vermut rojo, final amargo y cereza. ¿Qué cóctel es?',
            options: ['Manhattan', 'Daiquiri', 'Gin Tonic', 'Cosmopolitan'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Whisky de centeno, vermut rojo y angostura con cereza: el Manhattan.',
        },
        {
            question: 'Cremoso, tropical, coco y piña, textura espesa. ¿Qué cóctel es?',
            options: ['Piña Colada', 'Negroni', 'Martini', 'Whiskey Sour'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Ron, crema de coco y piña batidos dan la textura tropical y cremosa de la Piña Colada.',
        },
    ],

    'Examen Final': [
        {
            question: '¿En qué año y publicación apareció la primera definición documentada de "cocktail"?',
            options: ['1806, The Balance and Columbian Repository', '1862, How to Mix Drinks', '1750, London Gazette', '1900, Savoy Cocktail Book'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'En 1806, The Balance and Columbian Repository definió el cóctel como licor, azúcar, agua y bitters.',
        },
        {
            question: '¿Quién escribió "The Bartender\'s Guide" (How to Mix Drinks) de 1862?',
            options: ['Jerry Thomas', 'Harry Craddock', 'Dale DeGroff', 'Ada Coleman'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Jerry Thomas, "el padre de la coctelería americana", publicó el primer manual de bar en 1862.',
        },
        {
            question: 'En esferificación, ¿qué reactivo se combina con el alginato de sodio?',
            options: ['Cloruro de calcio', 'Bicarbonato de sodio', 'Ácido cítrico', 'Goma xantana'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El alginato de sodio gelifica en contacto con iones de calcio (cloruro de calcio), creando la membrana de la esfera.',
        },
        {
            question: '¿Qué define técnicamente a un "fat washing"?',
            options: ['Infusionar un destilado con grasa y luego solidificarla en frío para retirarla', 'Lavar el hielo con agua mineral', 'Clarificar zumo con clara de huevo', 'Diluir con agua de coco'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El fat washing infunde sabor de una grasa (p.ej. bacon, mantequilla) en el alcohol y luego se congela para separarla.',
        },
        {
            question: '¿Qué cóctel IBA usa Cynar, un amargo de alcachofa?',
            options: ['Cynar Spritz', 'Vesper', 'Sazerac', 'Aviation'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Cynar Spritz sustituye al Aperol por Cynar, amargo elaborado con alcachofa y hierbas.',
        },
        {
            question: 'El Sazerac tradicionalmente enjuaga la copa con ¿qué ingrediente?',
            options: ['Absenta', 'Vermut seco', 'Jerez fino', 'Chartreuse'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Sazerac se prepara enjuagando el vaso con absenta antes de añadir whisky de centeno, azúcar y Peychaud\'s.',
        },
    ],

    'Cristalería': [
        {
            question: '¿Qué cristalería se muestra?',
            visualGlass: 'martini',
            options: ['Copa Martini', 'Copa Coupe', 'Vaso Highball', 'Vaso Rocks'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La copa Martini tiene forma de V abierta sobre un tallo largo, ideal para cócteles servidos sin hielo.',
        },
        {
            question: '¿Qué cristalería se muestra?',
            visualGlass: 'coupe',
            options: ['Copa Coupe', 'Copa Flute', 'Copa Martini', 'Vaso Collins'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La coupe tiene un cuenco ancho y poco profundo; clásica para servir cócteles batidos sin hielo y espumosos.',
        },
        {
            question: '¿En qué vaso se sirve un Old Fashioned?',
            visualGlass: 'rocks',
            options: ['Vaso Rocks (bajo)', 'Vaso Highball', 'Copa Flute', 'Copa Nick & Nora'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El vaso rocks (old fashioned) es bajo y ancho, perfecto para servir sobre un cubo grande de hielo.',
        },
        {
            question: '¿Qué cristalería se muestra?',
            visualGlass: 'highball',
            options: ['Vaso Highball', 'Vaso Rocks', 'Copa Coupe', 'Copa Glencairn'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El vaso highball es alto y recto, usado para tragos largos con mucho mixer como el Gin Tonic o el Cuba Libre.',
        },
        {
            question: '¿Para qué bebida es típica esta copa?',
            visualGlass: 'flute',
            options: ['Champán / espumosos', 'Whisky solo', 'Negroni', 'Margarita'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La copa flute es alta y estrecha para conservar las burbujas del champán y los cócteles espumosos.',
        },
        {
            question: '¿Qué copa de cata se muestra?',
            visualGlass: 'glencairn',
            options: ['Glencairn (whisky)', 'Copa Martini', 'Vaso Highball', 'Copa Flute'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La Glencairn tiene forma de tulipa que concentra los aromas, diseñada para la cata de whisky.',
        },
    ],

    'Speed Run': [
        {
            question: 'Licor base del Mojito:',
            options: ['Ron', 'Gin', 'Vodka', 'Tequila'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Mojito se basa en ron blanco con lima, menta, azúcar y soda.',
        },
        {
            question: 'Cítrico esencial de la Margarita:',
            options: ['Lima', 'Naranja', 'Pomelo', 'Limón'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La lima aporta la acidez característica que equilibra tequila y triple seco.',
        },
        {
            question: 'El Cosmopolitan se sirve en copa de:',
            options: ['Cóctel', 'Old fashioned', 'Collins', 'Cobre'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Cosmopolitan se sirve sin hielo en copa de cóctel.',
        },
        {
            question: 'Bitter clásico del Old Fashioned:',
            options: ['Angostura', 'Peychaud', 'Naranja', 'Chocolate'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'La angostura es el bitter tradicional del Old Fashioned.',
        },
        {
            question: 'El Espresso Martini lleva, además de vodka:',
            options: ['Café espresso y licor de café', 'Crema y canela', 'Lima y menta', 'Vermut y cereza'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Vodka, espresso recién hecho y licor de café (p.ej. Kahlúa), agitado para crema.',
        },
        {
            question: 'Técnica para un Martini:',
            options: ['Remover', 'Agitar', 'Licuar', 'Flambear'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Martini se remueve para mantener la claridad y textura sedosa.',
        },
        {
            question: 'El Aperol Spritz se completa con:',
            options: ['Prosecco y soda', 'Tónica', 'Cola', 'Ginger beer'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'Aperol, prosecco y un toque de soda, servido con rodaja de naranja.',
        },
        {
            question: 'Guarnición típica del Martini:',
            options: ['Aceituna o twist de limón', 'Cereza', 'Menta', 'Canela'],
            correctAnswerIndex: 0,
            type: 'multiple-choice',
            explanation: 'El Martini se guarnece con aceituna (sucio/dirty) o twist de limón.',
        },
    ],
};

// A general pool combines a few from each topic for unknown/recipe quizzes.
const GENERAL: QuizQuestion[] = [
    ...BANK.Fundamentos.slice(0, 3),
    ...BANK['Flavor Pairing'].slice(0, 2),
    ...BANK['Examen Final'].slice(0, 2),
    ...BANK['Cata a Ciegas'].slice(0, 1),
];

/** Fisher-Yates shuffle that also re-indexes the correct option. */
const shuffleQuestion = (q: QuizQuestion): QuizQuestion => {
    const pairs = q.options.map((text, idx) => ({ text, isCorrect: idx === q.correctAnswerIndex }));
    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    return {
        ...q,
        options: pairs.map(p => p.text),
        correctAnswerIndex: pairs.findIndex(p => p.isCorrect),
    };
};

/**
 * Returns a curated offline quiz for a topic.
 * Shuffles both question order and option order so repeated plays vary.
 */
export const getFallbackQuiz = (topic: string, count: number): QuizQuestion[] => {
    const pool = BANK[topic] || GENERAL;
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffledPool.slice(0, Math.min(count, shuffledPool.length));
    return selected.map(shuffleQuestion);
};
