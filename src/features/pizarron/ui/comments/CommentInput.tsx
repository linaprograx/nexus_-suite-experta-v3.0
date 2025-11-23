import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

interface CommentInputProps {
  onSubmit: (message: string, mentions: string[]) => void;
  workspaceUsers?: { uid: string; displayName: string; photoURL?: string }[];
  placeholder?: string;
}

export const CommentInput: React.FC<CommentInputProps> = ({ 
  onSubmit, 
  workspaceUsers = [],
  placeholder = "Escribe un comentario... (@ para mencionar)" 
}) => {
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [mentionsList, setMentionsList] = useState<string[]>([]);

  // Mock users if none provided, but try to use passed users
  const users = workspaceUsers.length > 0 ? workspaceUsers : [
    { uid: '1', displayName: 'Usuario Actual', photoURL: '' },
    { uid: '2', displayName: 'Admin', photoURL: '' },
    { uid: '3', displayName: 'Equipo', photoURL: '' }
  ];

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    setMessage(newValue);
    setCursorPosition(newCursorPosition);

    // Detect @
    const lastChar = newValue.slice(newCursorPosition - 1, newCursorPosition);
    
    // Check if we are typing a mention
    const textBeforeCursor = newValue.slice(0, newCursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbolIndex !== -1) {
      // Check if there are spaces between @ and cursor, if so, close mentions unless it's the start of a name
      // Simple logic: if @ is detected and we are typing after it without newlines or too many spaces
      const textAfterAt = textBeforeCursor.slice(lastAtSymbolIndex + 1);
      if (!textAfterAt.includes(' ') || (textAfterAt.split(' ').length < 2)) { // Allow first name and part of last name? For now simple single word or tight spacing
         setShowMentions(true);
         setMentionQuery(textAfterAt);
         return;
      }
    }
    
    setShowMentions(false);
  };

  const handleSelectUser = (user: { uid: string; displayName: string }) => {
    // Replace @query with @Name
    const textBeforeCursor = message.slice(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    
    const prefix = message.slice(0, lastAtSymbolIndex);
    const suffix = message.slice(cursorPosition);
    
    const newMessage = `${prefix}@${user.displayName} ${suffix}`;
    setMessage(newMessage);
    setShowMentions(false);
    setMentionsList([...mentionsList, user.uid]);
    
    // Focus back
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };

  const handleSubmit = () => {
    if (!message.trim()) return;
    onSubmit(message, mentionsList);
    setMessage('');
    setMentionsList([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showMentions) {
        e.preventDefault();
        if (filteredUsers.length > 0) handleSelectUser(filteredUsers[0]);
      } else {
        e.preventDefault();
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative backdrop-blur-xl bg-white/20 dark:bg-slate-900/30 border border-white/30 dark:border-slate-800/40 rounded-2xl shadow-sm p-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm min-h-[80px] text-slate-700 dark:text-slate-200 placeholder-slate-400"
        />
        
        <div className="flex justify-between items-center mt-2 border-t border-white/10 dark:border-slate-700/30 pt-2">
          <div className="flex gap-2">
            <button className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-white/10 rounded-lg transition-colors" title="Adjuntar archivo">
               <Icon svg={ICONS.paperclip} className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-white/10 rounded-lg transition-colors" title="Emoji">
               <Icon svg={ICONS.star} className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={!message.trim()}
            className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
      </div>

      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase">
            Sugerencias
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.map(user => (
              <button
                key={user.uid}
                onClick={() => handleSelectUser(user)}
                className="w-full flex items-center gap-2 p-2 hover:bg-indigo-50 dark:hover:bg-slate-700 text-left transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {user.displayName.charAt(0)}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-200">{user.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
