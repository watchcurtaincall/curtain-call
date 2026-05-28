import { QuizPointTransaction } from '@/lib/types';

export interface AnswerRecord {
  questionId: string;
  selectedIndex: number;  // -1 for timeout
  elapsedMs: number;      // 0-5000
}

export function buildAnswerRecord(
  questionId: string,
  selectedIndex: number,
  elapsedMs: number
): AnswerRecord {
  return { questionId, selectedIndex, elapsedMs };
}

export interface SlotClaimResult {
  slotsRemaining: number;
  awardsIssued: number;
}

/**
 * Pure simulation of concurrent slot claiming - used in property tests.
 * Does NOT touch the database.
 */
export function claimWinnerSlotLogic(
  initialSlots: number,
  concurrentSubmissions: number
): SlotClaimResult {
  const awardsIssued = Math.min(initialSlots, concurrentSubmissions);
  const slotsRemaining = Math.max(0, initialSlots - concurrentSubmissions);
  return { slotsRemaining, awardsIssued };
}

export interface PointsBalanceDisplay {
  points: number;
  nairaEquivalent: number;
  display: string;
}

export function formatPointsBalance(balance: number): PointsBalanceDisplay {
  return {
    points: balance,
    nairaEquivalent: balance,  // 1 point = 1 Naira
    display: `${balance} points (₦${balance.toLocaleString()})`,
  };
}

export function sortTransactions(transactions: QuizPointTransaction[]): QuizPointTransaction[] {
  return [...transactions].sort((a, b) => {
    if (b.createdAt > a.createdAt) return 1;
    if (b.createdAt < a.createdAt) return -1;
    return 0;
  });
}
