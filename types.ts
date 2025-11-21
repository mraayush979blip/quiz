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
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Session {
  id: string;
  date: string;
  topic: string;
  type: Goal;
  content: any; // Can be QuizQuestion[], Flashcard[], or string (markdown)
  config: GeneratorConfig;
}
