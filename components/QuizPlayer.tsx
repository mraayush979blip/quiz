import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCcw, Award, ArrowRight } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizPlayerProps {
  data: QuizQuestion[];
  onRetry: () => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ data, onRetry }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const question = data[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === data.length - 1;

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    setSelectedOption(option);
    setShowResult(true);
    if (option === question.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsCompleted(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResult(false);
    setIsCompleted(false);
  };

  if (isCompleted) {
    const percentage = Math.round((score / data.length) * 100);
    let message = "Keep practicing!";
    if (percentage > 90) message = "Outstanding!";
    else if (percentage > 70) message = "Great job!";
    else if (percentage > 50) message = "Good effort!";

    return (
      <div className="max-w-xl mx-auto text-center animate-slide-up">
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-12 backdrop-blur-md">
          <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-fuchsia-500/30">
             <Award className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{message}</h2>
          <p className="text-zinc-400 mb-8">You scored {score} out of {data.length}</p>
          
          <div className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-10">
            {percentage}%
          </div>

          <button 
            onClick={handleRestart}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCcw className="w-5 h-5" />
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      {/* Progress Bar */}
      <div className="mb-6 flex items-center justify-between text-sm text-zinc-400">
        <span>Question {currentQuestionIndex + 1} / {data.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentQuestionIndex + 1) / data.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
        <h3 className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === question.correctAnswer;
            const showCorrectness = showResult && (isSelected || isCorrect);
            
            let buttonStyle = "bg-black/20 border-white/5 hover:bg-white/5";
            if (showResult) {
              if (isCorrect) buttonStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-200";
              else if (isSelected) buttonStyle = "bg-red-500/10 border-red-500/50 text-red-200";
              else buttonStyle = "bg-black/20 border-white/5 opacity-50";
            } else if (isSelected) {
               buttonStyle = "bg-violet-500/20 border-violet-500 text-violet-100";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${buttonStyle}`}
              >
                <span className="text-lg">{option}</span>
                {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Button */}
        {showResult && (
          <div className="mt-8 pt-6 border-t border-white/10 animate-fade-in">
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-zinc-300 mb-1">Explanation:</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">{question.explanation}</p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
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