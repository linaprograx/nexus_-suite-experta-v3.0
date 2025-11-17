import React from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useApp } from "../../../App";

const TodayTasks: React.FC = () => {
  const { db, userId, appId } = useApp();

  const [ideas, setIdeas] = React.useState<any[]>([]);
  const [cerebrityTasks, setCerebrityTasks] = React.useState<any[]>([]);
  const [labRecipes, setLabRecipes] = React.useState<any[]>([]);
  const [incompleteIngredients, setIncompleteIngredients] = React.useState<any[]>([]);

  // LOG para diagnóstico
  console.log("DEBUG: TodayTasks loaded with:", { userId, appId });

  // -----------------------------
  // IDEAS NUEVAS DEL PIZARRÓN
  // -----------------------------
  React.useEffect(() => {
    if (!db || !appId) return;

    const path = `artifacts/${appId}/public/data/pizarron-tasks`;
    console.log("DEBUG: Listening to", path);

    const ref = collection(db, path);

    return onSnapshot(ref, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("DEBUG IDEAS:", items);
      setIdeas(items);
    });
  }, [db, appId]);

  // -----------------------------
  // TAREAS DE CEREBRITY
  // -----------------------------
  React.useEffect(() => {
    if (!db || !userId) return;

    const path = `users/${userId}/cerebrity-history`;
    console.log("DEBUG: Listening:", path);

    const ref = collection(db, path);

    return onSnapshot(ref, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("DEBUG CEREBRITY:", items);
      setCerebrityTasks(items);
    });
  }, [db, userId]);

  // -----------------------------
  // RECETAS EN DESARROLLO (LAB)
  // -----------------------------
  React.useEffect(() => {
    if (!db || !userId) return;

    const path = `users/${userId}/the-lab-history`;
    console.log("DEBUG: Listening:", path);

    const ref = collection(db, path);

    return onSnapshot(ref, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("DEBUG LAB:", items);
      setLabRecipes(items);
    });
  }, [db, userId]);

  // -----------------------------
  // INGREDIENTES INCOMPLETOS
  // -----------------------------
  React.useEffect(() => {
    if (!db || !appId || !userId) return;

    const path = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    console.log("DEBUG: Listening:", path);

    const ref = collection(db, path);

    return onSnapshot(ref, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("DEBUG INGREDIENTS:", items);
      setIncompleteIngredients(items);
    });
  }, [db, userId, appId]);

  return (
    <div className="mt-16 space-y-14">
      <h2 className="text-2xl font-bold text-white">Lo que debes hacer hoy</h2>

      {/* IDEAS */}
      <section>
        <h3 className="text-xl font-semibold text-blue-300 mb-3">
          Ideas del Pizarrón
        </h3>
        {ideas.length === 0 && <p className="text-gray-400">No hay ideas.</p>}
        <div className="space-y-3">
          {ideas.map((i) => (
            <div key={i.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="text-white font-medium">
                {i.title || "Idea sin título"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CEREBRITY */}
      <section>
        <h3 className="text-xl font-semibold text-purple-300 mb-3">
          Tareas generadas por IA
        </h3>
        {cerebrityTasks.length === 0 && (
          <p className="text-gray-400">No hay tareas.</p>
        )}
        <div className="space-y-3">
          {cerebrityTasks.map((t) => (
            <div key={t.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="text-white font-medium">{t.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LAB */}
      <section>
        <h3 className="text-xl font-semibold text-green-300 mb-3">
          Recetas en desarrollo
        </h3>
        {labRecipes.length === 0 && (
          <p className="text-gray-400">No hay recetas en proceso.</p>
        )}
        <div className="space-y-3">
          {labRecipes.map((r) => (
            <div key={r.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="text-white font-medium">{r.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* INGREDIENTES */}
      <section>
        <h3 className="text-xl font-semibold text-red-300 mb-3">
          Ingredientes incompletos
        </h3>
        {incompleteIngredients.length === 0 && (
          <p className="text-gray-400">No hay ingredientes incompletos.</p>
        )}
        <div className="space-y-3">
          {incompleteIngredients.map((ing) => (
            <div key={ing.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="text-white font-medium">{ing.nombre}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TodayTasks;
