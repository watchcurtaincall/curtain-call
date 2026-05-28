import { QuizQuestionInternal } from '@/lib/types';

/**
 * Validates a question object returned by the AI generator.
 * Returns true iff all fields are present and within bounds.
 */
export function validateQuestion(q: any): q is QuizQuestionInternal {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.text !== 'string' || q.text.length === 0 || q.text.length > 300) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (q.options.some((o: any) => typeof o !== 'string' || o.length === 0 || o.length > 150)) return false;
  if (typeof q.correctAnswerIndex !== 'number') return false;
  if (!Number.isInteger(q.correctAnswerIndex) || q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) return false;
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) return false;
  return true;
}

/**
 * Validates an array of 5 questions from the AI generator.
 * Returns true iff all 5 are valid.
 */
export function validateQuestions(questions: any[]): boolean {
  if (!Array.isArray(questions) || questions.length !== 5) return false;
  return questions.every(validateQuestion);
}
