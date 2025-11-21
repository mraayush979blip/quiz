import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from '../services/firebase';
import { Sparkles, AlertCircle, ArrowRight, Copy, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

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

  const handleGoogleLogin = async () => {
    setError(null);
    setDomainError(null);

    if (!auth || !googleProvider) {
      setError("Firebase is not configured correctly.");
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      handleError(err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="relative z-10 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full animate-slide-up">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 mx-auto mb-6 rotate-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-display font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {isSignUp ? 'Join Quizzy AI to start mastering topics.' : 'Sign in to continue your learning journey.'}
          </p>
        </div>

        {/* Domain Authorization Error Block */}
        {domainError && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-left animate-fade-in">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <h3 className="text-sm font-bold text-amber-200">Domain Not Authorized</h3>
            </div>
            <p className="text-xs text-amber-200/70 mb-3">
              Firebase blocks sign-ins from unknown domains.
            </p>
            <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-lg border border-amber-500/10 mb-2">
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

        {/* General Error Block */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-start gap-2 text-left animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all placeholder:text-zinc-600"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-zinc-500 text-xs uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>Google</span>
        </button>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            {isSignUp ? (
              <>Already have an account? <span className="text-fuchsia-400 font-semibold ml-1">Log In</span></>
            ) : (
              <>Don't have an account? <span className="text-fuchsia-400 font-semibold ml-1">Create One</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;