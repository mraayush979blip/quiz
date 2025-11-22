export type Goal = 'quiz' | 'flashcards' | 'simplify' | 'deep_dive';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratorConfig {
  topic: string;
  file?: {
    base64: string;
    mimeType: string;
    name: string;
  };
  goal: Goal;
  difficulty: Difficulty;
  count: number; // Number of questions/cards
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty?: Difficulty; // Added for analysis
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Session {
  id?: string;
  date: string;
  topic: string;
  type: Goal;
  content: any; 
  config: GeneratorConfig;
  score?: number;
  totalQuestions?: number;
  timestamp?: number;
  duration?: number;
}

export type AppView = 'generator' | 'session' | 'progress' | 'live';