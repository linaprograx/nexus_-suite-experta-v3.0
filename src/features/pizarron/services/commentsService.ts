import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  Firestore,
  getDoc
} from 'firebase/firestore';
import { TaskComment } from '../../../../types';

export function listenTaskComments(
  db: Firestore, 
  appId: string, 
  taskId: string, 
  callback: (comments: TaskComment[]) => void
) {
  const commentsRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks/${taskId}/comments`);
  const q = query(commentsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaskComment));
    callback(comments);
  });
}

export async function addTaskComment(
  db: Firestore, 
  appId: string, 
  taskId: string, 
  payload: { message: string; mentions?: string[]; attachments?: any[] }, 
  user: { uid: string; displayName: string; photoURL: string }
) {
  const commentsRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks/${taskId}/comments`);
  
  const newComment: Omit<TaskComment, 'id'> = {
    taskId,
    authorId: user.uid,
    authorName: user.displayName || 'Usuario',
    authorAvatar: user.photoURL || '',
    message: payload.message,
    mentions: payload.mentions || [],
    attachments: payload.attachments || [],
    createdAt: Date.now(), // Client side timestamp for immediate UI, server will overwrite if using serverTimestamp but types.ts says number
    updatedAt: Date.now(),
    reactions: {}
  };

  await addDoc(commentsRef, {
    ...newComment,
    createdAt: serverTimestamp(), // Use server timestamp for consistency
    updatedAt: serverTimestamp()
  });
}

export async function editTaskComment(
  db: Firestore, 
  appId: string, 
  taskId: string, 
  commentId: string, 
  message: string
) {
  const commentRef = doc(db, `artifacts/${appId}/public/data/pizarron-tasks/${taskId}/comments`, commentId);
  await updateDoc(commentRef, {
    message,
    updatedAt: serverTimestamp()
  });
}

export async function deleteTaskComment(
  db: Firestore, 
  appId: string, 
  taskId: string, 
  commentId: string
) {
  const commentRef = doc(db, `artifacts/${appId}/public/data/pizarron-tasks/${taskId}/comments`, commentId);
  await deleteDoc(commentRef);
}

export async function toggleReaction(
  db: Firestore, 
  appId: string, 
  taskId: string, 
  commentId: string, 
  emoji: string, 
  userId: string
) {
  const commentRef = doc(db, `artifacts/${appId}/public/data/pizarron-tasks/${taskId}/comments`, commentId);
  const commentSnap = await getDoc(commentRef);
  
  if (commentSnap.exists()) {
    const data = commentSnap.data() as TaskComment;
    const currentReactions = data.reactions || {};
    const usersReacted = currentReactions[emoji] || [];
    
    let newUsersReacted;
    if (usersReacted.includes(userId)) {
      newUsersReacted = usersReacted.filter(id => id !== userId);
    } else {
      newUsersReacted = [...usersReacted, userId];
    }
    
    await updateDoc(commentRef, {
      [`reactions.${emoji}`]: newUsersReacted
    });
  }
}
