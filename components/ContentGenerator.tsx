import React, { useState, useRef } from 'react';
import { Upload, FileText, Brain, Zap, Search, X, Loader2, Sliders } from 'lucide-react';
import { GeneratorConfig, Goal, Difficulty } from '../types';

interface ContentGeneratorProps {
  onGenerate: (config: GeneratorConfig) => void;
  isGenerating: boolean;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ onGenerate, isGenerating }) => {
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<{ name: string, base64: string, mimeType: string } | undefined>(undefined);
  const [goal, setGoal] = useState<Goal>('quiz');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [count, setCount] = useState(10); // Default count
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 4 * 1024 * 1024) {
      alert("File is too large. Please upload a file smaller than 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFile({
        name: selectedFile.name,
        base64: reader.result as string,
        mimeType: selectedFile.type
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic && !file) return;
    onGenerate({ topic, file, goal, difficulty, count });
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 dark:text-white mb-3">
          What do you want to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">master today?</span>
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">Upload a document or enter a topic to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-xl dark:shadow-2xl transition-colors">
        
        {/* Topic Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Topic or Concept</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Roman History, React Hooks..."
            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl p-4 text-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 focus:outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Source Material (Optional)</label>
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-violet-500/50 transition-all group"
            >
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Click to upload Image or PDF</p>
            </div>
          ) : (
            <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3 overflow-hidden">
                 <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
                 <span className="text-sm text-violet-700 dark:text-violet-200 truncate">{file.name}</span>
               </div>
               <button 
                 type="button" 
                 onClick={() => { setFile(undefined); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                 className="p-1.5 hover:bg-violet-200 dark:hover:bg-violet-500/20 rounded-lg text-violet-700 dark:text-violet-300 transition-colors"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf" 
            className="hidden"
          />
        </div>

        {/* Goal Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Learning Goal</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'quiz', label: 'Take a Quiz', icon: Brain },
              { id: 'flashcards', label: 'Flashcards', icon: Zap },
              { id: 'simplify', label: 'Simplify', icon: FileText },
              { id: 'deep_dive', label: 'Deep Dive', icon: Search },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setGoal(item.id as Goal)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  goal === item.id 
                    ? 'bg-zinc-900 dark:bg-white/10 border-zinc-900 dark:border-violet-500/50 text-white shadow-lg shadow-zinc-900/20 dark:shadow-violet-500/10' 
                    : 'bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <item.icon className={`w-5 h-5 ${goal === item.id ? 'text-violet-300 dark:text-violet-400' : 'text-current'}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Difficulty</label>
            <div className="flex bg-zinc-100 dark:bg-black/40 p-1 rounded-xl border border-zinc-200 dark:border-white/5">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    difficulty === level
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-white/5'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Count Selection (Only for Quiz/Flashcards) */}
          {(goal === 'quiz' || goal === 'flashcards') && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex justify-between">
                <span>Quantity</span>
                <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">{count}</span>
              </label>
              <div className="flex items-center gap-4 bg-zinc-100 dark:bg-black/40 p-3 rounded-xl border border-zinc-200 dark:border-white/5 h-[42px]">
                <Sliders className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <input 
                  type="range" 
                  min="5" 
                  max="20" 
                  step="1"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-600 dark:accent-fuchsia-500"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isGenerating || (!topic && !file)}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-fuchsia-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Generate Session
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ContentGenerator;