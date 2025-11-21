import React from 'react';
import { X, MessageSquare, Brain, FileText, Search, Trash2 } from 'lucide-react';
import { Session, Goal } from '../types';

interface HistorySidebarProps {
  sessions: Session[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (session: Session) => void;
  onNew: () => void;
  activeSessionId?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ sessions, isOpen, onClose, onSelect, activeSessionId, onNew }) => {
  const getIcon = (type: Goal) => {
    switch (type) {
      case 'quiz': return <Brain className="w-4 h-4 text-violet-400" />;
      case 'flashcards': return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'simplify': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'deep_dive': return <Search className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-40 w-80 bg-zinc-950/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-white">Library</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
             <button 
              onClick={onNew}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-200 font-medium transition-all flex items-center justify-center gap-2"
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
              <button
                key={session.id}
                onClick={() => onSelect(session)}
                className={`w-full text-left p-3 rounded-xl transition-all group border ${activeSessionId === session.id ? 'bg-white/10 border-white/10' : 'border-transparent hover:bg-white/5 hover:border-white/5'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-1.5 rounded-lg bg-black/40 ${activeSessionId === session.id ? 'ring-1 ring-white/20' : ''}`}>
                    {getIcon(session.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium truncate ${activeSessionId === session.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                      {session.topic}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 flex justify-between items-center">
                      <span className="capitalize">{session.type.replace('_', ' ')}</span>
                      <span>{formatDate(session.date)}</span>
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-white/10 text-xs text-center text-zinc-600">
          Saved locally in your browser.
        </div>
      </div>
    </aside>
  );
};

export default HistorySidebar;