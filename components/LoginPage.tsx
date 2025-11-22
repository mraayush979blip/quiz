import React, { useState } from 'react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from '../services/firebase';
import { Sparkles, AlertCircle, Copy, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      setError("Invalid email or password.");
    } else if (errorCode === 'auth/operation-not-allowed') {
      setError("Email/Password login is not enabled in Firebase Console.");
    } else {
      setError(errorMessage || "Authentication failed.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDomainError(null);
    setLoading(true);

    if (!auth) {
      setError("Firebase not initialized.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/10 dark:bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="relative z-10 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full animate-slide-up transition-all">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 mx-auto mb-6 rotate-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {isSignUp ? 'Join Quizzy AI to start mastering topics.' : 'Sign in to continue your learning journey.'}
          </p>
        </div>

        {/* Domain Authorization Error Block */}
        {domainError && (
          <div className="bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-xl p-4 mb-6 text-left animate-fade-in">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-200">Domain Not Authorized</h3>
            </div>
            <p className="text-xs text-amber-700/70 dark:text-amber-200/70 mb-3">
              Firebase blocks sign-ins from unknown domains.
            </p>
            <div className="flex items-center gap-2 bg-amber-100 dark:bg-black/40 p-2.5 rounded-lg border border-amber-500/10 mb-2">
              <code className="flex-1 text-xs font-mono text-amber-800 dark:text-amber-100 truncate">{domainError}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(domainError)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-amber-700 dark:text-amber-200 transition-colors"
                title="Copy Domain"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* General Error Block */}
        {error && (
          <div className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-lg p-3 mb-6 flex items-start gap-2 text-left animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span>Processing...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors"
          >
            {isSignUp ? (
              <>Already have an account? <span className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold ml-1">Log In</span></>
            ) : (
              <>Don't have an account? <span className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold ml-1">Create One</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;