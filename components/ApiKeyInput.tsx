import React, { useState } from 'react';
import { Key, Lock, AlertCircle, ExternalLink } from 'lucide-react';

interface ApiKeyInputProps {
  currentKey: string;
  onSave: (key: string) => void;
  onCancel?: () => void;
  error?: string | null;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ currentKey, onSave, onCancel, error }) => {
  const [value, setValue] = useState(currentKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSave(value.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-6 text-fuchsia-400">
          <div className="p-3 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20">
             <Key className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Gemini API Key</h2>
        </div>

        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          To use Quizzy AI, you need a Google Gemini API Key. Your key is stored locally in your browser and never sent to our servers.
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative mb-6">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all placeholder:text-zinc-600"
              required
            />
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Save Key
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 flex justify-center">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-fuchsia-400 transition-colors"
          >
            Get your API Key here <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInput;