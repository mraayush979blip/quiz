import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardPlayerProps {
  data: Flashcard[];
}

const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentIndex < data.length - 1) {
           setIsFlipped(false);
           setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
           setIsFlipped(false);
           setCurrentIndex(prev => prev - 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setIsFlipped(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, data.length]);

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[60vh] flex flex-col animate-slide-up">
      <div className="flex justify-between items-center mb-4 text-zinc-500 dark:text-zinc-400">
        <span className="text-sm font-medium">Card {currentIndex + 1} of {data.length}</span>
        <div className="text-xs flex items-center gap-2">
           <span className="hidden md:inline">Press Space to Next, ↑ to Flip</span>
        </div>
      </div>

      {/* Card Container - Perspective needed for 3D flip */}
      <div className="flex-1 relative perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div 
          className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl transition-colors">
             <div className="text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase mb-4">Term</div>
             <h3 className="text-2xl md:text-4xl font-bold text-zinc-900 dark:text-white">{data[currentIndex].front}</h3>
             <p className="absolute bottom-6 text-zinc-400 dark:text-zinc-500 text-sm">Click to flip</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-50 dark:bg-zinc-800/50 backdrop-blur-md border border-violet-200 dark:border-violet-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl">
             <div className="text-xs font-bold tracking-widest text-fuchsia-600 dark:text-fuchsia-400 uppercase mb-4">Definition</div>
             <p className="text-xl md:text-2xl font-medium text-zinc-800 dark:text-zinc-100 leading-relaxed">{data[currentIndex].back}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-center gap-6">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-4 rounded-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="p-4 rounded-full bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 transition-all shadow-sm"
        >
          <RotateCcw className={`w-6 h-6 transition-transform duration-500 ${isFlipped ? '-rotate-180' : ''}`} />
        </button>

        <button 
          onClick={handleNext}
          disabled={currentIndex === data.length - 1}
          className="p-4 rounded-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardPlayer;