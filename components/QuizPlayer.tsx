import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCcw, Award, ArrowRight, Timer, AlertCircle, ChevronDown, ChevronUp, BarChart } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizPlayerProps {
  data: QuizQuestion[];
  onRetry: () => void;
  onComplete?: (score: number, total: number, duration: number) => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ data, onRetry, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(new Array(data.length).fill(null));
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const question = data[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === data.length - 1;

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; 
    
    setSelectedOption(option);
    setShowResult(true);
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);

    if (option === question.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsCompleted(true);
      setIsActive(false);
      if (onComplete) {
        onComplete(score, data.length, seconds);
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setUserAnswers(new Array(data.length).fill(null));
    setScore(0);
    setShowResult(false);
    setIsCompleted(false);
    setSeconds(0);
    setIsActive(true);
    onRetry();
  };

  const getDifficultyColor = (diff?: string) => {
    switch(diff) {
      case 'hard': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'easy': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  const calculateStats = () => {
    const stats: Record<string, { total: number, correct: number }> = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 },
    };

    data.forEach((q, idx) => {
      const diff = q.difficulty || 'medium';
      if (!stats[diff]) stats[diff] = { total: 0, correct: 0 };
      
      stats[diff].total += 1;
      if (userAnswers[idx] === q.correctAnswer) {
        stats[diff].correct += 1;
      }
    });

    return stats;
  };

  if (isCompleted) {
    const percentage = Math.round((score / data.length) * 100);
    const stats = calculateStats();
    
    let message = "Keep practicing!";
    if (percentage > 90) message = "Outstanding!";
    else if (percentage > 70) message = "Great job!";
    else if (percentage > 50) message = "Good effort!";

    return (
      <div className="max-w-3xl mx-auto animate-slide-up pb-20">
        <div className="backdrop-blur-xl bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl mb-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-fuchsia-500/30">
             <Award className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{message}</h2>
          <div className="flex justify-center items-center gap-8 mb-8 text-zinc-600 dark:text-zinc-400">
            <div className="flex flex-col">
               <span className="text-xs uppercase tracking-wider opacity-70 font-bold">Score</span>
               <span className="text-2xl font-bold text-zinc-900 dark:text-white">{score} / {data.length}</span>
            </div>
            <div className="w-px h-10 bg-zinc-200 dark:bg-white/10"></div>
            <div className="flex flex-col">
               <span className="text-xs uppercase tracking-wider opacity-70 font-bold">Time</span>
               <span className="text-2xl font-bold text-zinc-900 dark:text-white">{formatTime(seconds)}</span>
            </div>
            <div className="w-px h-10 bg-zinc-200 dark:bg-white/10"></div>
             <div className="flex flex-col">
               <span className="text-xs uppercase tracking-wider opacity-70 font-bold">Accuracy</span>
               <span className="text-2xl font-bold text-zinc-900 dark:text-white">{percentage}%</span>
            </div>
          </div>

          <button 
            onClick={handleRestart}
            className="px-8 py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-bold transition-all inline-flex items-center gap-2 shadow-lg"
          >
            <RefreshCcw className="w-5 h-5" />
            Retake Quiz
          </button>
        </div>

        <div className="backdrop-blur-xl bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-white/10 rounded-3xl p-6 mb-8">
           <div className="flex items-center gap-2 mb-4">
             <BarChart className="w-5 h-5 text-violet-500" />
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Difficulty Breakdown</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {(['easy', 'medium', 'hard'] as const).map(level => {
               const s = stats[level];
               if (s.total === 0) return null;
               const levelPercent = Math.round((s.correct / s.total) * 100);
               return (
                 <div key={level} className="p-4 bg-white/30 dark:bg-black/20 rounded-2xl border border-white/20 dark:border-white/5">
                   <div className="flex justify-between items-center mb-2">
                     <span className="capitalize font-bold text-zinc-700 dark:text-zinc-200">{level}</span>
                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(level)}`}>
                       {levelPercent}% Correct
                     </span>
                   </div>
                   <div className="w-full bg-zinc-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                     <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          level === 'easy' ? 'bg-emerald-500' : level === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${levelPercent}%` }} 
                     />
                   </div>
                   <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-right font-medium">{s.correct}/{s.total} Correct</p>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white px-2">Question Analysis</h3>
          
          {data.map((q, idx) => {
            const userAnswer = userAnswers[idx];
            const isCorrect = userAnswer === q.correctAnswer;
            const isExpanded = expandedQuestion === idx;

            return (
              <div 
                key={idx} 
                className={`backdrop-blur-md bg-white/40 dark:bg-zinc-900/40 border rounded-2xl overflow-hidden transition-all ${
                  isCorrect 
                    ? 'border-white/20 dark:border-white/10' 
                    : 'border-red-500/20 bg-red-500/5 dark:bg-red-500/10'
                }`}
              >
                <div 
                  onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                  className="p-5 flex items-start gap-4 cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
                >
                   <div className="mt-1">
                     {isCorrect ? (
                       <CheckCircle className="w-6 h-6 text-emerald-500" />
                     ) : (
                       <XCircle className="w-6 h-6 text-red-500" />
                     )}
                   </div>
                   
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Question {idx + 1}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${getDifficultyColor(q.difficulty)}`}>
                           {q.difficulty || 'medium'}
                        </span>
                      </div>
                      <p className="text-zinc-900 dark:text-white font-medium text-lg pr-8">{q.question}</p>
                   </div>

                   <div className="text-zinc-400 mt-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                   </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-6 pl-16 animate-fade-in">
                    <div className="space-y-3">
                       <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 uppercase font-bold">Your Answer</p>
                          <p className={`font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                            {userAnswer || "No Answer"}
                          </p>
                       </div>

                       {!isCorrect && (
                         <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 uppercase font-bold">Correct Answer</p>
                            <p className="font-bold text-emerald-700 dark:text-emerald-300">
                              {q.correctAnswer}
                            </p>
                         </div>
                       )}

                       <div className="p-4 rounded-xl bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                             <AlertCircle className="w-4 h-4 text-violet-500" />
                             <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold">Explanation</p>
                          </div>
                          <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                            {q.explanation}
                          </p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span className="font-medium">Question {currentQuestionIndex + 1} <span className="opacity-50">/ {data.length}</span></span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono bg-white/50 dark:bg-white/5 px-3 py-1 rounded-lg border border-white/20 dark:border-white/10 backdrop-blur-sm">
            <Timer className="w-4 h-4" />
            {formatTime(seconds)}
          </div>
          <div className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty || 'Medium'}
          </div>
        </div>
      </div>
      <div className="w-full h-2 bg-zinc-200 dark:bg-white/5 rounded-full mb-8 overflow-hidden backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentQuestionIndex + 1) / data.length) * 100}%` }}
        />
      </div>

      <div className="backdrop-blur-xl bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl transition-colors">
        <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-8 leading-relaxed">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === question.correctAnswer;
            
            let buttonStyle = "bg-white/40 dark:bg-black/20 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200";
            
            if (showResult) {
              if (isCorrect) buttonStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-200 font-bold";
              else if (isSelected) buttonStyle = "bg-red-500/10 border-red-500 text-red-700 dark:text-red-200 font-bold";
              else buttonStyle = "bg-white/20 dark:bg-white/5 border-transparent opacity-50";
            } else if (isSelected) {
               buttonStyle = "bg-violet-500/20 border-violet-500 text-violet-800 dark:text-white";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                disabled={showResult}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group ${buttonStyle}`}
              >
                <span className="text-lg">{option}</span>
                {showResult && isCorrect && <CheckCircle className="w-6 h-6 text-emerald-500 animate-bounce" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500 animate-shake" />}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-8 pt-8 border-t border-white/20 dark:border-white/10 animate-fade-in">
            <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-5 mb-6 border border-white/20 dark:border-white/5">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-violet-500" /> Explanation:
              </h4>
              <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{question.explanation}</p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02]"
            >
              {isLastQuestion ? "See Results" : "Next Question"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;