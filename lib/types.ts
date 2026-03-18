// =============================================================================
// TypeScript Interfaces for CA Exam Portal
// NOTE FOR VERCEL DEPLOYMENT: JSON file storage will NOT persist between
// serverless function invocations. Replace fs operations with Vercel KV (Redis)
// or MongoDB Atlas for production. See API routes for specific lines to change.
// =============================================================================

export interface User {
  username: string;
  password: string;
  role: 'student' | 'admin';
}

export interface UsersData {
  users: User[];
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  marks: number;
  difficulty: 'medium' | 'hard' | 'scenario';
}

export interface ShortQuestion {
  id: number;
  question: string;
  modelAnswer: string;
  keywords: string[];
  marks: number;
}

export interface CaseQuestion {
  id: number;
  caseScenario: string;
  question: string;
  modelAnswer: string;
  keywords: string[];
  marks: number;
}

export interface QuestionsData {
  mcq: MCQQuestion[];
  short: ShortQuestion[];
  case: CaseQuestion[];
}

export interface MCQResult {
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  marksAwarded: number;
}

export interface ShortResult {
  questionId: number;
  userAnswer: string;
  modelAnswer: string;
  keywordsMatched: string[];
  totalKeywords: number;
  marksAwarded: number;
  maxMarks: number;
}

export interface CaseResult {
  questionId: number;
  userAnswer: string;
  modelAnswer: string;
  caseScenario: string;
  keywordsMatched: string[];
  totalKeywords: number;
  marksAwarded: number;
  maxMarks: number;
}

export interface Attempt {
  attemptId: string;
  attemptNumber: number;
  submittedAt: string;
  mcqAnswers: Record<string, string>; // questionId -> selected option
  shortAnswers: Record<string, string>; // questionId -> text answer
  caseAnswers: Record<string, string>; // questionId -> text answer
  mcqResults: MCQResult[];
  shortResults: ShortResult[];
  caseResults: CaseResult[];
  mcqScore: number;
  shortScore: number;
  caseScore: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
}

export interface ResultsData {
  [username: string]: Attempt[];
}

export interface AdminAttemptRow extends Attempt {
  username: string;
}

export interface SubmitPayload {
  username: string;
  mcqAnswers: Record<string, string>;
  shortAnswers: Record<string, string>;
  caseAnswers: Record<string, string>;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface SessionData {
  loggedIn: boolean;
  username: string;
  role: 'student' | 'admin';
  loginTime: string;
}
