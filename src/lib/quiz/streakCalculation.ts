// Streak calculation logic anchored to WAT (UTC+1)

export function toWATDateString(date: Date): string {
  // WAT = UTC+1: add 1 hour offset
  const wat = new Date(date.getTime() + 60 * 60 * 1000);
  return wat.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate the new streak count after a quiz completion.
 * - First ever completion (lastCompletionDate is null): returns 1
 * - Completed on the day immediately after last completion: increments by 1
 * - Completed on the same day as last completion: returns currentStreak unchanged
 * - Gap of 2+ days: resets to 1 (fresh start)
 */
export function calculateNewStreak(
  currentStreak: number,
  lastCompletionDate: Date | null,
  todayWAT: Date
): number {
  if (!lastCompletionDate) return 1;

  const lastDateStr = toWATDateString(lastCompletionDate);
  const todayStr = toWATDateString(todayWAT);
  const yesterdayStr = toWATDateString(addDays(todayWAT, -1));

  if (lastDateStr === yesterdayStr) {
    return currentStreak + 1; // consecutive day
  } else if (lastDateStr === todayStr) {
    return currentStreak; // same day - no change
  } else {
    return 1; // gap - reset and start fresh
  }
}

/**
 * Determine if a streak should be reset to 0 at midnight.
 * Called by the midnight cron for users who did not complete the quiz yesterday.
 */
export function shouldResetStreak(
  lastCompletionDate: Date | null,
  todayWAT: Date
): boolean {
  if (!lastCompletionDate) return false;
  const lastDateStr = toWATDateString(lastCompletionDate);
  const yesterdayStr = toWATDateString(addDays(todayWAT, -1));
  // If last completion was before yesterday, streak should be reset
  return lastDateStr < yesterdayStr;
}
