import React, { useState, useEffect } from 'react';
import { Menu, Plus, Settings, History, Sparkles, LogOut } from 'lucide-react';
import { Session, GeneratorConfig } from './types';
import { generateContent } from './services/geminiService';
import ApiKeyInput from './components/ApiKeyInput';
import HistorySidebar from './components/HistorySidebar';
import ContentGenerator from './components/ContentGenerator';
import QuizPlayer from './components/QuizPlayer';
import FlashcardPlayer from './components/FlashcardPlayer';
import MarkdownReader from './components/MarkdownReader';
import LoginPage from './components/LoginPage';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

const LOCAL_STORAGE_KEY_API = 'quizzy_ai_key';
const LOCAL_STORAGE_KEY_HISTORY = 'quizzy_ai_history';
const DEFAULT_API_KEY = "AIzaSyBtAiQznbRhnRRZPrWf3wb2vBRsrfcXCdA";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Authentication
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

  // Load API Key & History
  useEffect(() => {
    // Handle API Key - Use Default if not present
    const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY_API);
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      // Apply default key automatically
      setApiKey(DEFAULT_API_KEY);
      localStorage.setItem(LOCAL_STORAGE_KEY_API, DEFAULT_API_KEY);
    }

    const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
    if (storedHistory) {
      try {
        setSessions(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Persist history when it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(sessions));
  }, [sessions]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(LOCAL_STORAGE_KEY_API, key);
    setIsSettingsOpen(false);
    setError(null); 
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setSessions([]); // Clear session display
    }
  };

  const handleGenerate = async (config: GeneratorConfig) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateContent(apiKey, config);
      
      const newSession: Session = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        topic: config.topic || (config.file ? 'Document Analysis' : 'General'),
        type: config.goal,
        content: result,
        config: config
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
    } catch (err: any) {
      console.error(err);
      if (err.toString().includes('403') || err.toString().includes('key')) {
         setError("Your API Key seems invalid or expired. Please check settings.");
         setIsSettingsOpen(true);
      } else {
        setError("Failed to generate content. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSession = (session: Session) => {
    setCurrentSession(session);
    setIsSidebarOpen(false); 
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] animate-fade-in">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-t-fuchsia-500 border-r-violet-500 border-b-fuchsia-500/50 border-l-violet-500/50 rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto text-white w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Dreaming up your content...</h2>
          <p className="text-zinc-400">Gemini is analyzing and generating via 2.5 Flash.</p>
        </div>
      );
    }

    if (!currentSession) {
      return <ContentGenerator onGenerate={handleGenerate} isGenerating={isGenerating} />;
    }

    switch (currentSession.type) {
      case 'quiz':
        return <QuizPlayer data={currentSession.content} onRetry={() => {}} />;
      case 'flashcards':
        return <FlashcardPlayer data={currentSession.content} />;
      case 'simplify':
      case 'deep_dive':
        return <MarkdownReader content={currentSession.content} type={currentSession.type} />;
      default:
        return <div>Unknown content type</div>;
    }
  };

  // --- Render Logic ---

  if (authLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-fuchsia-500/30">
      {/* API Key Modal */}
      {isSettingsOpen && (
        <ApiKeyInput 
          currentKey={apiKey || ''} 
          onSave={handleSaveApiKey} 
          onCancel={() => setIsSettingsOpen(false)}
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
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-lg border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              {isSidebarOpen ? <History className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleNewSession}>
               <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                 <Sparkles className="w-4 h-4 text-white" />
               </div>
               <h1 className="text-lg font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 hidden sm:block">
                 Quizzy AI
               </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentSession && (
              <button 
                onClick={handleNewSession}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
              >
                <Plus className="w-4 h-4" />
                New Session
              </button>
            )}
            
            {/* User Profile / Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {user.photoURL && (
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/10" />
              )}
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="container mx-auto max-w-5xl px-4 py-8 min-h-[calc(100vh-64px)]">
          {renderContent()}
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;