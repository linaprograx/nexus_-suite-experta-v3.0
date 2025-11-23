import React, { useState, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import { TaskComment } from '../../../../../types';
import { listenTaskComments, addTaskComment, editTaskComment, deleteTaskComment, toggleReaction } from '../../services/commentsService';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';
import { Spinner } from '../../../../components/ui/Spinner';

interface CommentsPanelProps {
  taskId: string;
  db: Firestore;
  appId: string;
  user: { uid: string; displayName: string; photoURL?: string };
  workspaceUsers?: { uid: string; displayName: string; photoURL?: string }[];
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ 
  taskId, 
  db, 
  appId, 
  user,
  workspaceUsers 
}) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenTaskComments(db, appId, taskId, (data) => {
      setComments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db, appId, taskId]);

  const handleSubmit = async (message: string, mentions: string[]) => {
    try {
      await addTaskComment(db, appId, taskId, { message, mentions }, { 
        uid: user.uid, 
        displayName: user.displayName, 
        photoURL: user.photoURL || '' 
      });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleEdit = async (commentId: string, newMessage: string) => {
    try {
      await editTaskComment(db, appId, taskId, commentId, newMessage);
    } catch (error) {
       console.error("Error editing comment:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm("¿Estás seguro de eliminar este comentario?")) {
      try {
        await deleteTaskComment(db, appId, taskId, commentId);
      } catch (error) {
         console.error("Error deleting comment:", error);
      }
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    try {
      await toggleReaction(db, appId, taskId, commentId, emoji, user.uid);
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 max-h-[60vh] custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm italic">
            No hay comentarios aún. Sé el primero en escribir.
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={{ uid: user.uid, displayName: user.displayName }}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onToggleReaction={handleToggleReaction}
            />
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <CommentInput 
          onSubmit={handleSubmit}
          workspaceUsers={workspaceUsers}
        />
      </div>
    </div>
  );
};
