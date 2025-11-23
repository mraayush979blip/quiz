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
    e.stopPropagation();
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
      className={`fixed inset-y-0 left-0 z-40 w-80 backdrop-blur-2xl bg-white/80 dark:bg-zinc-950/80 border-r border-white/20 dark:border-white/10 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-full flex flex-col">
        <div className="p-5 border-b border-zinc-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">Library</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-zinc-500 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
             <button 
              onClick={onNew}
              className="w-full py-3 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
               <span>+ New Study Session</span>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
              <p className="text-sm">No history yet.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id || session.timestamp} className="relative group">
                {deletingId === session.id ? (
                  <div className="absolute inset-0 z-10 bg-red-500/90 rounded-xl flex items-center justify-between px-4 text-white animate-fade-in backdrop-blur-sm">
                    <span className="text-xs font-bold">Delete?</span>
                    <div className="flex items-center gap-2">
                       <button onClick={cancelDelete} className="p-1 hover:bg-white/20 rounded"><X className="w-4 h-4"/></button>
                       <button onClick={(e) => confirmDelete(e, session.id!)} className="p-1 hover:bg-white/20 rounded"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ) : null}
                
                <button
                  onClick={() => onSelect(session)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${activeSessionId === session.id ? 'bg-white dark:bg-white/10 border-violet-500/30 shadow-md' : 'border-transparent hover:bg-white/50 dark:hover:bg-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-lg bg-zinc-100 dark:bg-black/40 ${activeSessionId === session.id ? 'ring-1 ring-violet-500/50' : ''}`}>
                      {getIcon(session.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-bold truncate pr-2 ${activeSessionId === session.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
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
                      <p className="text-xs text-zinc-500 mt-1 flex justify-between items-center font-medium">
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
        
        <div className="p-4 border-t border-zinc-200/50 dark:border-white/10 text-xs text-center text-zinc-500 dark:text-zinc-600">
          Saved in your Cloud Library.
        </div>
      </div>
    </aside>
  );
};

export default HistorySidebar;