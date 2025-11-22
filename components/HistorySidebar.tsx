
import React, { useState } from 'react';
import { X, MessageSquare, Brain, FileText, Search, Trash2, AlertTriangle } from 'lucide-react';
import { Session, Goal } from '../types';

interface HistorySidebarProps {
  sessions: Session[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (session: Session) => void;
  onNew: () => void;
  onDelete: (sessionId: string) => void;
  activeSessionId?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ sessions, isOpen, onClose, onSelect, activeSessionId, onNew, onDelete }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getIcon = (type: Goal) => {
    switch (type) {
      case 'quiz': return <Brain className="w-4 h-4 text-violet-500 dark:text-violet-400" />;
      case 'flashcards': return <MessageSquare className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'simplify': return <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case 'deep_dive': return <Search className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent selecting the session
    setDeletingId(id);
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
    setDeletingId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-200 dark:border-white/10 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-zinc-900 dark:text-white">Library</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-500 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
             <button 
              onClick={onNew}
              className="w-full py-2.5 px-4 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-zinc-200 font-medium transition-all flex items-center justify-center gap-2"
            >
               <span>+ New Study Session</span>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
              <p className="text-sm">No history yet.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id || session.timestamp} className="relative group">
                {deletingId === session.id ? (
                  <div className="absolute inset-0 z-10 bg-red-500/90 rounded-xl flex items-center justify-between px-4 text-white animate-fade-in">
                    <span className="text-xs font-bold">Delete?</span>
                    <div className="flex items-center gap-2">
                       <button onClick={cancelDelete} className="p-1 hover:bg-white/20 rounded"><X className="w-4 h-4"/></button>
                       <button onClick={(e) => confirmDelete(e, session.id!)} className="p-1 hover:bg-white/20 rounded"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ) : null}
                
                <button
                  onClick={() => onSelect(session)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${activeSessionId === session.id ? 'bg-zinc-100 dark:bg-white/10 border-zinc-200 dark:border-white/10' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-zinc-200 dark:hover:border-white/5'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-1.5 rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/5 ${activeSessionId === session.id ? 'ring-1 ring-zinc-300 dark:ring-white/20' : ''}`}>
                      {getIcon(session.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium truncate pr-2 ${activeSessionId === session.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                          {session.topic}
                        </h3>
                        {session.id && (
                          <div 
                             onClick={(e) => handleDeleteClick(e, session.id!)}
                             className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 flex justify-between items-center">
                        <span className="capitalize">{session.type.replace('_', ' ')}</span>
                        <span>{formatDate(session.date)}</span>
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-zinc-200 dark:border-white/10 text-xs text-center text-zinc-500 dark:text-zinc-600">
          Saved in your Cloud Library.
        </div>
      </div>
    </aside>
  );
};

export default HistorySidebar;
