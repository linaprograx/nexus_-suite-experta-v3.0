import React from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useApp } from "../../../App";

interface Ingredient {
  id: string;
  nombre: string;
  precioCompra?: number | null;
  standardQuantity?: number;
  [key: string]: any;
}

const TodayTasks: React.FC = () => {
  const { db, userId, appId } = useApp();
  const [ideas, setIdeas] = React.useState<any[]>([]);
  const [cerebrityTasks, setCerebrityTasks] = React.useState<any[]>([]);
  const [labRecipes, setLabRecipes] = React.useState<any[]>([]);
  const [incompleteIngredients, setIncompleteIngredients] = React.useState<Ingredient[]>([]);

  // -----------------------------
  // Load Pizarrón ideas (tasks)
  // -----------------------------
  React.useEffect(() => {
    if (!db || !appId) return;

    const ref = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);
    const q = query(ref, where("status", "==", "new"));

    return onSnapshot(q, (snap) => {
      setIdeas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [db, appId]);

  // -----------------------------
  // Cerebrity tasks
  // -----------------------------
  React.useEffect(() => {
    if (!db || !userId) return;

    const ref = collection(db, `users/${userId}/cerebrity-history`);
    const q = query(ref, where("type", "==", "task"), where("completed", "==", false));

    return onSnapshot(q, (snap) => {
      setCerebrityTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [db, userId]);

  // -----------------------------
  // The Lab - recipes in progress
  // -----------------------------
  React.useEffect(() => {
    if (!db || !userId) return;

    const ref = collection(db, `users/${userId}/the-lab-history`);
    const q = query(ref, where("state", "==", "in-progress"));

    return onSnapshot(q, (snap) => {
      setLabRecipes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [db, userId]);

  // -----------------------------
  // Incomplete Ingredients
  // -----------------------------
  React.useEffect(() => {
    if (!db || !appId || !userId) return;

    const ref = collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`);

    return onSnapshot(ref, (snap) => {
      const items: Ingredient[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ingredient));
      const incomplete = items.filter(
        (item) =>
          item.precioCompra === 0 ||
          item.standardQuantity === 0 ||
          item.precioCompra === null
      );
      setIncompleteIngredients(incomplete);
    });
  }, [db, userId, appId]);

  return (
    <div className="mt-12 space-y-12">
      <h2 className="text-2xl font-bold text-white">Lo que debes hacer hoy</h2>

      {/* IDEAS NUEVAS */}
      {ideas.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-blue-300 mb-3">Ideas nuevas sin clasificar</h3>
          <div className="space-y-3">
            {ideas.map((i) => (
              <div key={i.id} className="bg-gray-800 p-4 rounded-lg flex justify-between">
                <div>{i.title || "Idea sin título"}</div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-blue-600 rounded">→ Lab</button>
                  <button className="px-2 py-1 bg-yellow-500 rounded">⭐</button>
                  <button className="px-2 py-1 bg-green-600 rounded">✔</button>
                  <button className="px-2 py-1 bg-gray-600 rounded">🗂</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAREAS CEREBRITY */}
      {cerebrityTasks.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-purple-300 mb-3">Tareas generadas por IA</h3>
          <div className="space-y-3">
            {cerebrityTasks.map((t) => (
              <div key={t.id} className="bg-gray-800 p-4 rounded-lg flex justify-between">
                <div>{t.text || "Tarea IA"}</div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-green-600 rounded">✔</button>
                  <button className="px-2 py-1 bg-blue-600 rounded">→ Lab</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECETAS EN PROCESO */}
      {labRecipes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-green-300 mb-3">Recetas en desarrollo</h3>
          <div className="space-y-3">
            {labRecipes.map((r) => (
              <div key={r.id} className="bg-gray-800 p-4 rounded-lg flex justify-between">
                <div>{r.title || "Receta en progreso"}</div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-green-600 rounded">✔</button>
                  <button className="px-2 py-1 bg-blue-600 rounded">🧪 Abrir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INGREDIENTES INCOMPLETOS */}
      {incompleteIngredients.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-red-300 mb-3">Ingredientes incompletos</h3>
          <div className="space-y-3">
            {incompleteIngredients.map((ing) => (
              <div key={ing.id} className="bg-gray-800 p-4 rounded-lg flex justify-between">
                <div>{ing.nombre || "Ingrediente"}</div>
                <button className="px-3 py-1 bg-yellow-600 rounded">💲 Añadir precio</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayTasks;
