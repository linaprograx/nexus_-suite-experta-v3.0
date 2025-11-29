import { parseMultipleRecipes, RecipeFirestore } from '../utils/recipeImporter';
import { Ingredient } from '../../types';

// Hardcode de ingredientes existentes para simular la base de datos
const mockAllIngredients: Ingredient[] = [
  { id: '1', nombre: 'Mezcla base', categoria: 'Preparaciones', precioCompra: 10, unidadCompra: 'Botella (1L)', standardUnit: 'ml', standardQuantity: 1000, standardPrice: 0.01 },
  { id: '2', nombre: 'Lima', categoria: 'Frutas', precioCompra: 2, unidadCompra: 'Malla (1kg)', standardUnit: 'und', standardQuantity: 10, standardPrice: 0.2 },
  { id: '3', nombre: 'Azúcar Invertido', categoria: 'Endulzantes', precioCompra: 5, unidadCompra: 'Bote (500g)', standardUnit: 'g', standardQuantity: 500, standardPrice: 0.01 },
  { id: '4', nombre: 'Ron Blanco', categoria: 'Destilados', precioCompra: 15, unidadCompra: 'Botella (700ml)', standardUnit: 'ml', standardQuantity: 700, standardPrice: 0.0214 },
  { id: '5', nombre: 'Maracuyá', categoria: 'Frutas', precioCompra: 3, unidadCompra: 'Caja (6 und)', standardUnit: 'und', standardQuantity: 6, standardPrice: 0.5 },
];

// Contenido del archivo TXT de ejemplo
const mockTxtContent = `
---
[Nombre] Cacao – Milk Punch de Maracuyá
[Categorias] Milk Punch, Carta
[Ingredientes]
- 300ml Mezcla base
- 20ml Lima clarificada
- 10g Azúcar invertido
[Preparacion]
1. Mezclar todos los ingredientes en una coctelera con hielo.
2. Agitar enérgicamente durante 15 segundos.
3. Doble colar en una copa coupe fría.
[Garnish]
Aros de maracuyá deshidratado
---
[Nombre] Daiquiri Clásico
[Categorias] Clásicos, Ron
[Ingredientes]
- 60ml Ron Blanco
- 30ml Zumo de Lima Fresco
- 15ml Jarabe Simple
[Preparacion]
1. Enfriar la copa.
2. Añadir todos los ingredientes a la coctelera.
3. Agitar con hielo y servir.
[Garnish]
Rodaja de lima
---
`;

/**
 * Función para ejecutar el test de importación desde la consola del navegador.
 * Para usar:
 * 1. Abre la consola de desarrollador en el navegador.
 * 2. Llama a `window.runImporterTest()`.
 * 3. Revisa los resultados impresos en la consola.
 */
export const runImporterTest = () => {
  console.log("--- INICIANDO TEST DE IMPORTACIÓN DE RECETAS ---");
  console.log("Ingredientes existentes (simulados):", mockAllIngredients);
  console.log("Contenido TXT a parsear:", mockTxtContent);

  try {
    const recetasParseadas: RecipeFirestore[] = parseMultipleRecipes(mockTxtContent, mockAllIngredients);

    console.log("\n--- RESULTADO DEL PARSEO ---");
    if (recetasParseadas.length > 0) {
      console.log(`Se han parseado ${recetasParseadas.length} recetas exitosamente.`);
      recetasParseadas.forEach((receta, index) => {
        console.log(`\n--- Receta ${index + 1} ---`);
        console.log("Nombre:", receta.nombre);
        console.log("Categorías:", receta.categorias);
        console.log("Ingredientes Estructurados:", receta.ingredientes);
        console.log("Preparación:", receta.preparacion);
        console.log("Garnish:", receta.garnish);
        console.log("Objeto completo listo para Firestore:", receta);
      });
    } else {
      console.warn("No se pudo parsear ninguna receta.");
    }
  } catch (error) {
    console.error("Ha ocurrido un error durante el test de importación:", error);
  } finally {
    console.log("\n--- TEST DE IMPORTACIÓN FINALIZADO ---");
  }
};

// Para facilitar la ejecución, se puede adjuntar la función al objeto window
// (solo en entorno de desarrollo)
if (process.env.NODE_ENV === 'development') {
  (window as any).runImporterTest = runImporterTest;
}
