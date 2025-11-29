import { callGeminiApi } from '../../../utils/gemini';
import { cleanJSON } from '../../../utils/jsonCleaner';

// Importar todos los poderes existentes
import { powerGarnishOptimizer } from './powerGarnishOptimizer';
import { powerStorytellingImprover } from './powerStorytellingImprover';
import { powerCreativeBooster } from './creativeBooster';
import { powerStorytellingAnalyzer } from './storytellingAnalyzer';
import { powerRarenessIdentifier } from './rarenessIdentifier';
import { powerHarmonyOptimizer } from './harmonyOptimizer';
import { powerFlavorMapper } from './flavorMapper';

// Mapa universal basado en nombres bonitos
export const powersRegistry: Record<string, any> = {
  "Optimización del Garnish": powerGarnishOptimizer,
  "Mejora de Storytelling": powerStorytellingImprover,
  "Creative Booster Avanzado": powerCreativeBooster,
  "Analizador de Storytelling": powerStorytellingAnalyzer,
  "Identificador de Rarezas": powerRarenessIdentifier,
  "Harmony Optimizer": powerHarmonyOptimizer,
  "Mapeo de Sabores": powerFlavorMapper
};

export async function runPowerUniversal(powerName: string, payload: any) {
  const fn = powersRegistry[powerName];

  if (!fn) {
    return {
      title: "Poder no encontrado",
      summary: `No existe un poder llamado ${powerName}`,
      sections: []
    };
  }

  try {
    const result = await fn(payload);

    if (!result || typeof result !== "object") {
      return {
        title: `${powerName} (Fallback)` ,
        summary: "La respuesta del modelo no siguió el formato JSON esperado.",
        sections: []
      };
    }

    return result;
  } catch (err) {
    console.error("[runPowerUniversal] Error ejecutando", powerName, err);
    return {
      title: `${powerName} (Error)` ,
      summary: "Ocurrió un error al procesar este poder.",
      sections: []
    };
  }
}
