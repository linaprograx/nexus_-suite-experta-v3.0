import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  Firestore 
} from 'firebase/firestore';
import { TaskHistoryItem } from '../../../../types';

export function listenTaskHistory(
  db: Firestore, 
  appId: string, 
  taskId: string, 
  callback: (history: TaskHistoryItem[]) => void
) {
  const historyRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks/${taskId}/history`);
  const q = query(historyRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaskHistoryItem));
    callback(history);
  });
}

export async function addTaskHistory(
  db: Firestore, 
  appId: string, 
  taskId: string, 
  type: string, 
  authorId: string, 
  authorName: string,
  description: string
) {
  const historyRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks/${taskId}/history`);
  
  await addDoc(historyRef, {
    taskId,
    type,
    authorId,
    authorName,
    description,
    createdAt: Date.now() // or serverTimestamp() if consistent with types
  });
}
