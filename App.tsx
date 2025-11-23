import React, { useState, useEffect } from 'react';
import { Menu, Plus, History, Sparkles, Sun, Moon, Brain, Zap, BrainCircuit } from 'lucide-react';
import { Session, GeneratorConfig, AppView } from './types';
import { generateContent } from './services/geminiService';
import { saveSessionToHistory, getUserHistory, updateSessionScore, deleteSession } from './services/dbService';
import HistorySidebar from './components/HistorySidebar';
import ProfileSidebar from './components/ProfileSidebar';
import ContentGenerator from './components/ContentGenerator';
import QuizPlayer from './components/QuizPlayer';
import FlashcardPlayer from './components/FlashcardPlayer';
import MarkdownReader from './components/MarkdownReader';
import LoginPage from './components/LoginPage';
import ProgressDashboard from './components/ProgressDashboard';
import LiveAssistant from './components/LiveAssistant';
import ApiKeyInput from './components/ApiKeyInput';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    }
    return 'dark';
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [view, setView] = useState<AppView>('generator');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        const history = await getUserHistory(user.uid);
        setSessions(history);
      } else {
        setSessions([]);
      }
    };
    loadHistory();
  }, [user]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setSessions([]);
      setIsProfileOpen(false);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowApiKeyModal(false);
    setError(null);
  };

  const handleGenerate = async (config: GeneratorConfig) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateContent(config, apiKey);
      
      const newSession: Session = {
        date: new Date().toISOString(),
        topic: config.topic || (config.file ? 'Document Analysis' : 'General'),
        type: config.goal,
        content: result,
        config: config,
        timestamp: Date.now()
      };

      if (user) {
        await saveSessionToHistory(user.uid, newSession);
        const history = await getUserHistory(user.uid);
        setSessions(history);
        const savedSession = history.find(s => s.timestamp === newSession.timestamp) || newSession;
        setCurrentSession(savedSession);
        setView('session');
      }
    } catch (err: any) {
      console.error("Generation Error", err);
      let errorMessage = "Failed to generate content.";
      
      if (err.message) {
        if (err.message.includes('403') || err.message.includes('restricted')) {
          errorMessage = "The API Key was rejected. It is likely restricted to a different domain. Please check Google Cloud Console.";
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = "Network Error. Please check your internet connection.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSession = (session: Session) => {
    setCurrentSession(session);
    setView('session');
    setIsSidebarOpen(false); 
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setView('generator');
    setIsSidebarOpen(false);
  };

  const handleShowProgress = () => {
    setView('progress');
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await deleteSession(user.uid, sessionId);
      
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);

      if (currentSession?.id === sessionId) {
        handleNewSession();
      }
    } catch (e) {
      console.error("Failed to delete", e);
      setError("Could not delete session.");
    }
  };

  const handleQuizComplete = async (score: number, total: number, duration: number) => {
    if (user && currentSession && currentSession.id) {
      const updatedSessions = sessions.map(s => 
        s.id === currentSession.id ? { ...s, score, totalQuestions: total, duration } : s
      );
      setSessions(updatedSessions);
      await updateSessionScore(user.uid, currentSession.id, score, total, duration);
    }
  };

  const renderContent = () => {
    if (view === 'live') {
      return <LiveAssistant onClose={() => setView('generator')} userName={user?.displayName || 'Student'} apiKey={apiKey} />;
    }

    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-fade-in">
          <div className="relative w-32 h-32 mb-10">
            <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-2 border-fuchsia-500/40 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 border-4 border-t-transparent border-r-violet-500 border-b-transparent border-l-violet-500/50 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-4 border-4 border-t-fuchsia-500/80 border-r-transparent border-b-fuchsia-500/80 border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <Brain className="w-12 h-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-bounce">
               <Sparkles className="w-6 h-6 text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]" />
            </div>
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 animate-pulse">
               <Zap className="w-5 h-5 text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
            </div>
          </div>
          <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-3 animate-slide-up">Thinking...</h2>
          <p className="text-zinc-400 max-w-md text-center leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Generating your personalized content... Thank you for choosing Quizzy AI. (From Aayush & Kanishka)
          </p>
        </div>
      );
    }

    if (view === 'progress') {
      return <ProgressDashboard sessions={sessions} />;
    }

    if (view === 'generator') {
      return (
        <div>
          {error && (
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center flex flex-col items-center gap-2 backdrop-blur-md">
              <p>{error}</p>
              {error.includes('API Key') && (
                 <button onClick={() => setShowApiKeyModal(true)} className="text-sm underline hover:text-red-300">Update API Key</button>
              )}
            </div>
          )}
          <ContentGenerator onGenerate={handleGenerate} isGenerating={isGenerating} />
        </div>
      );
    }

    if (currentSession && view === 'session') {
      switch (currentSession.type) {
        case 'quiz':
          return <QuizPlayer data={currentSession.content} onRetry={() => {}} onComplete={handleQuizComplete} />;
        case 'flashcards':
          return <FlashcardPlayer data={currentSession.content} />;
        case 'simplify':
        case 'deep_dive':
          return <MarkdownReader content={currentSession.content} type={currentSession.type} />;
        default:
          return <div>Unknown content type</div>;
      }
    }
    
    return null;
  };

  if (authLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-x-hidden relative">
      
      {/* Global Ambient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-500/10 blur-[100px] animate-blob" style={{animationDelay: '2s'}} />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-cyan-500/5 blur-[100px] animate-blob" style={{animationDelay: '4s'}} />
      </div>

      {/* Fallback API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyInput 
          currentKey={apiKey} 
          onSave={handleSaveApiKey} 
          onCancel={() => setShowApiKeyModal(false)}
          error={error}
        />
      )}

      {/* Sidebar */}
      <HistorySidebar 
        sessions={sessions} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onSelect={handleSelectSession}
        activeSessionId={currentSession?.id}
        onNew={handleNewSession}
        onDelete={handleDeleteSession}
      />

      {/* Profile Sidebar */}
      <ProfileSidebar 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={handleLogout}
        onShowProgress={handleShowProgress}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
        {/* Glossy Header */}
        <header className="sticky top-0 z-20 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-white/10 px-4 py-3 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              {isSidebarOpen ? <History className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer group" onClick={handleNewSession}>
               <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                 <Sparkles className="w-4 h-4 text-white" />
               </div>
               <h1 className="text-lg font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 hidden sm:block">
                 Quizzy AI
               </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('live')}
              className="group relative flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300"
              title="Start Voice Session"
            >
              <div className="relative">
                 <div className="absolute -inset-1 bg-fuchsia-500 rounded-full opacity-0 group-hover:opacity-20 group-hover:animate-ping transition-opacity" />
                 <BrainCircuit className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 relative z-10" />
              </div>
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 hidden sm:block group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                MindSpeak
              </span>
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {view !== 'generator' && (
              <button 
                onClick={handleNewSession}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/5 dark:border-white/10 rounded-full transition-all"
              >
                <Plus className="w-4 h-4" />
                New Session
              </button>
            )}
            
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-white/10 ml-2"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/10 ring-2 ring-transparent hover:ring-violet-500/50 transition-all" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-300 hover:bg-violet-500/30 transition-colors">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </header>

        <main className="container mx-auto max-w-5xl px-4 py-8 min-h-[calc(100vh-64px)] relative z-10">
          {renderContent()}
        </main>
      </div>
      
      {(isSidebarOpen || isProfileOpen) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => { setIsSidebarOpen(false); setIsProfileOpen(false); }}
        />
      )}
    </div>
  );
};

export default App;