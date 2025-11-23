import React, { useState } from 'react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from '../services/firebase';
import { Sparkles, AlertCircle, Copy, Mail, Lock, UserPlus, LogIn, KeyRound, ChevronLeft, CheckCircle, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleError = (err: any) => {
    console.error("Auth Error:", err);
    const errorCode = err.code || '';
    const errorMessage = err.message || '';

    if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('auth/unauthorized-domain')) {
      setDomainError(window.location.hostname);
    } else if (errorCode === 'auth/email-already-in-use') {
      setError("This email is already registered. Please log in.");
    } else if (errorCode === 'auth/weak-password') {
      setError("Password should be at least 6 characters.");
    } else if (errorCode === 'auth/invalid-email') {
      setError("Please enter a valid email address.");
    } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      if (view === 'login') {
        setError("Account not found or password incorrect.");
      } else if (view === 'reset') {
        setError("No account found with this email address.");
      } else {
        setError("Invalid email or password.");
      }
    } else if (errorCode === 'auth/too-many-requests') {
      setError("Too many attempts. Please try again later.");
    } else {
      setError(errorMessage || "Authentication failed.");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setDomainError(null);
    setLoading(true);

    if (!auth) {
      setError("Firebase not initialized.");
      setLoading(false);
      return;
    }

    try {
      if (view === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (view === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("Password reset link sent! Check your inbox (and spam).");
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleView = (newView: 'login' | 'signup' | 'reset') => {
    setView(newView);
    setError(null);
    setSuccessMsg(null);
    setDomainError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-600/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative z-10 backdrop-blur-2xl bg-white/10 dark:bg-zinc-900/60 border border-white/20 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full animate-slide-up transition-all">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <div key={view} className="animate-fade-in">
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              {view === 'signup' ? 'Create Account' : view === 'reset' ? 'Recovery' : 'Welcome Back'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {view === 'signup' ? 'Join Quizzy AI to start mastering topics.' : 
               view === 'reset' ? 'Enter your email to reset your password.' :
               'Sign in to continue your learning journey.'}
            </p>
          </div>
        </div>

        {domainError && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-left animate-fade-in">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <h3 className="text-sm font-bold text-amber-200">Domain Not Authorized</h3>
            </div>
            <div className="flex items-center gap-2 bg-black/20 p-2.5 rounded-lg border border-amber-500/10">
              <code className="flex-1 text-xs font-mono text-amber-100 truncate">{domainError}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(domainError)}
                className="p-1.5 hover:bg-white/10 rounded-md text-amber-200 transition-colors"
                title="Copy Domain"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3 text-left animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-300">{error}</p>
              {/* Smart suggestion if account doesn't exist */}
              {view === 'login' && error.includes("not found") && (
                <button 
                  onClick={() => toggleView('signup')}
                  className="mt-2 text-xs font-bold text-red-200 flex items-center gap-1 hover:text-white transition-colors"
                >
                  Create account <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 flex items-start gap-3 text-left animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-300">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5 mb-8" key={view}>
          <div className={`space-y-4 ${view === 'signup' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-zinc-600"
                required
              />
            </div>
            
            {view !== 'reset' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
            )}
          </div>

          {view === 'login' && (
            <div className="flex justify-end animate-fade-in">
              <button 
                type="button"
                onClick={() => toggleView('reset')}
                className="text-xs text-zinc-400 hover:text-fuchsia-400 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]`}
          >
            {loading ? (
              <span>Processing...</span>
            ) : view === 'signup' ? (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            ) : view === 'reset' ? (
              <>
                <KeyRound className="w-5 h-5" />
                Send Reset Link
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          {view === 'reset' ? (
             <button
               onClick={() => toggleView('login')}
               className="text-zinc-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 w-full"
             >
               <ChevronLeft className="w-4 h-4" /> Back to Login
             </button>
          ) : (
            <button
              onClick={() => toggleView(view === 'login' ? 'signup' : 'login')}
              className="text-zinc-400 hover:text-white text-sm transition-colors"
            >
              {view === 'login' ? (
                <>Don't have an account? <span className="text-fuchsia-400 font-bold ml-1">Create One</span></>
              ) : (
                <>Already have an account? <span className="text-fuchsia-400 font-bold ml-1">Log In</span></>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginPage;