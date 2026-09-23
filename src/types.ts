export type Subject = 'Physics' | 'Chemistry' | 'Mathematics';

export type QuestionStatus = 'unvisited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked';

export interface Question {
  id: number; // overall global question number (1-indexed for the test)
  subject: Subject;
  text: string;
  options: string[];
  correctOption: number; // 0 for A, 1 for B, 2 for C, 3 for D
  solution: string;
  type: string; // e.g. "Single Choice Type"
  diagrams?: string;
  correctAnswerText?: string;
  topic?: string;
  estimatedTimeSeconds?: number;
  _isLoading?: boolean;
}

export interface Exam {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds, e.g. 10800 for 3 hours
  questions: Question[];
}

export interface ExamSession {
  paperId: number;
  answers: Record<number, number | string>; // questionId -> chosen index (0-3) or numerical string
  statuses: Record<number, QuestionStatus>; // questionId -> QuestionStatus
  timeSpent: Record<number, number>; // questionId -> seconds spent
  secondsRemaining: number;
  isCompleted: boolean;
  cheatingWarnings: number;
  completedAt?: string;
  score?: number;
  totalMarks?: number;
  reportStats?: {
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    totalTimeSpent?: number;
  };
}

export interface Metric {
  value: number;
  label: string;
}

export interface Weakness {
  subject: string;
  topic: string;
  priority: string;
}

export interface AISuggestion {
  status?: string;
  summary?: {
    what_went_well: string[];
    key_areas_for_improvement: string[];
  };
  behavioral_metrics: {
    speed_accuracy_score: Metric;
    guessing_probability: Metric;
    strategy_score: Metric;
  };
  weakness_mapping: Weakness[];
  coaching_tip: string;
  radar_data?: {
    subject: string;
    score: number;
  }[];
}

export interface ExamTypeConfig {
  exam_code: string;
  name: string;
  subjects: string[];
  duration_seconds?: number;
  total_questions?: number;
  total_marks?: number;
  is_active?: boolean;
}

