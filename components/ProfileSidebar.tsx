
import React from 'react';
import { X, LogOut, User, BarChart2, Sparkles } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser;
  onLogout: () => void;
  onShowProgress: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose, user, onLogout, onShowProgress }) => {
  return (
    <aside 
      className={`fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-200 dark:border-white/10 transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-zinc-900 dark:text-white">Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-500 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center border-b border-zinc-200 dark:border-white/5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-1 mb-4 shadow-lg shadow-fuchsia-500/20">
                <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-zinc-900 dark:text-white">{user.email?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white break-all">{user.displayName || "Quizzy Scholar"}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
        </div>

        <div className="p-4 space-y-2">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2">Menu</h4>
            
            <button 
                onClick={() => { onShowProgress(); onClose(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 group"
            >
                <div className="p-2 rounded-lg bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-white transition-colors">
                    <BarChart2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <span className="font-medium block">Progress Report</span>
                    <span className="text-xs text-zinc-500">View your stats & streaks</span>
                </div>
            </button>
            
            {/* Placeholder for future features */}
            <div className="w-full flex items-center gap-3 p-3 rounded-xl text-left opacity-50 cursor-not-allowed text-zinc-700 dark:text-zinc-400">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <span className="font-medium block">Premium Plan</span>
                    <span className="text-xs text-zinc-500">Coming soon</span>
                </div>
            </div>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-200 dark:border-white/10">
            <button 
                onClick={onLogout}
                className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-white/5 transition-all font-medium"
            >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
            </button>
        </div>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
