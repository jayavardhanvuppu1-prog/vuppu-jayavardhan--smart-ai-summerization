export type ActiveTab = "dashboard" | "notes" | "summary" | "quiz" | "flashcards";

export type SummaryDepth = "standard" | "simple" | "exam";
export type QuizCount = 5 | 10 | 20;
export type QuizDifficulty = "foundational" | "balanced" | "challenge";

export interface SimpleExplanation {
  concept: string;
  explanation: string;
  analogy: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface StudySummary {
  title: string;
  overview: string;
  keyPoints: string[];
  simpleExplanations: SimpleExplanation[];
  keyTerms: KeyTerm[];
  depth: SummaryDepth;
  generatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedQuiz {
  topic: string;
  questions: QuizQuestion[];
  difficulty: QuizDifficulty;
  generatedAt: string;
}

export interface QuizAttempt {
  id: string;
  topic: string;
  score: number;
  total: number;
  percentage: number;
  difficulty: QuizDifficulty;
  completedAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint: string;
}

export interface FlashcardDeck {
  topic: string;
  cards: Flashcard[];
  masteredIds: string[];
  generatedAt: string;
}
