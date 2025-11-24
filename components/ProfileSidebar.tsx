import React from 'react';
import { X, LogOut, User, BarChart2, Sparkles, Settings } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser;
  onLogout: () => void;
  onShowProgress: () => void;
  onOpenSettings: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose, user, onLogout, onShowProgress, onOpenSettings }) => {
  const isAdmin = user.email === 'mraayush979@gmail.com';

  return (
    <aside 
      className={`fixed inset-y-0 right-0 z-50 w-80 backdrop-blur-2xl bg-white/80 dark:bg-zinc-950/80 border-l border-white/20 dark:border-white/10 transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="h-full flex flex-col">
        <div className="p-5 border-b border-zinc-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-zinc-500 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center border-b border-zinc-200/50 dark:border-white/5">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-1 mb-4 shadow-xl shadow-fuchsia-500/30">
                <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden border-4 border-white/20">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl font-bold text-zinc-900 dark:text-white">{user.email?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white break-all">{user.displayName || "Quizzy Scholar"}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{user.email}</p>
        </div>

        <div className="p-5 space-y-2">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 mb-2">Menu</h4>
            
            <button 
                onClick={() => { onShowProgress(); onClose(); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:bg-white/50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 group border border-transparent hover:border-white/10"
            >
                <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 group-hover:bg-fuchsia-500 group-hover:text-white transition-colors">
                    <BarChart2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <span className="font-bold block">Progress Report</span>
                    <span className="text-xs text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400">View your stats & streaks</span>
                </div>
            </button>

            {/* Admin Settings for Specific User */}
            {isAdmin && (
              <button 
                  onClick={() => { onOpenSettings(); onClose(); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:bg-white/50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 group border border-transparent hover:border-white/10"
              >
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                      <Settings className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                      <span className="font-bold block">Admin Settings</span>
                      <span className="text-xs text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400">Update Voice API Key</span>
                  </div>
              </button>
            )}
            
            <div className="w-full flex items-center gap-4 p-4 rounded-2xl text-left opacity-50 cursor-not-allowed text-zinc-700 dark:text-zinc-400 border border-transparent">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <span className="font-bold block">Premium Plan</span>
                    <span className="text-xs text-zinc-500">Coming soon</span>
                </div>
            </div>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-200/50 dark:border-white/10">
            <button 
                onClick={onLogout}
                className="w-full py-3.5 flex items-center justify-center gap-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200/50 dark:border-white/5 transition-all font-bold shadow-sm"
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