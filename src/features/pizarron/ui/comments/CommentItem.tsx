import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TaskComment } from '../../../../../types';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

interface CommentItemProps {
  comment: TaskComment;
  currentUser: { uid: string; displayName: string };
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, newMessage: string) => void;
  onToggleReaction?: (commentId: string, emoji: string) => void;
}

const REACTIONS = ['🔥', '❤️', '✔️', '💡'];

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  currentUser, 
  onDelete, 
  onEdit,
  onToggleReaction
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(comment.message);

  const isAuthor = comment.authorId === currentUser.uid;

  const handleSaveEdit = () => {
    if (onEdit && editMessage.trim() !== '') {
      onEdit(comment.id, editMessage);
      setIsEditing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="group relative p-4 mb-3 backdrop-blur-xl bg-white/20 dark:bg-slate-900/30 border border-white/30 dark:border-slate-800/40 rounded-2xl shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        {comment.authorAvatar ? (
          <img 
            src={comment.authorAvatar} 
            alt={comment.authorName} 
            className="w-8 h-8 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                {comment.authorName}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(comment.createdAt)}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-[10px] text-slate-400 italic">(editado)</span>
              )}
            </div>
            
            {isAuthor && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 hover:bg-white/20 rounded text-slate-500 hover:text-indigo-500 transition-colors"
                  title="Editar"
                >
                  <Icon svg={ICONS.edit} className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => onDelete && onDelete(comment.id)}
                  className="p-1 hover:bg-white/20 rounded text-slate-500 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Icon svg={ICONS.trash} className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 rounded"
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
              <ReactMarkdown>{comment.message}</ReactMarkdown>
            </div>
          )}

          {/* Reactions */}
          <div className="flex flex-wrap items-center gap-1 mt-3">
            {REACTIONS.map(emoji => {
              const userIds = comment.reactions?.[emoji] || [];
              const count = userIds.length;
              const hasReacted = userIds.includes(currentUser.uid);
              
              return (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction && onToggleReaction(comment.id, emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                    hasReacted 
                      ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' 
                      : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 grayscale hover:grayscale-0'
                  }`}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="font-medium">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
