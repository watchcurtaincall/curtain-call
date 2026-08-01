// Streak calculation logic anchored to WAT (UTC+1)

export function toWATDateString(date: Date): string {
  // WAT = UTC+1: add 1 hour offset
  const wat = new Date(date.getTime() + 60 * 60 * 1000);
  const day = wat.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const sunday = new Date(wat);
  sunday.setUTCDate(wat.getUTCDate() - day);
  return sunday.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Calculate the new streak count after a quiz completion.
 * - First ever completion (lastCompletionDate is null): returns 1
 * - Completed on the consecutive week: increments by 1
 * - Completed on the same week: returns currentStreak unchanged
 * - Gap of 2+ weeks: resets to 1 (fresh start)
 */
export function calculateNewStreak(
  currentStreak: number,
  lastCompletionDate: Date | null,
  todayWAT: Date
): number {
  if (!lastCompletionDate) return 1;

  const lastDateStr = toWATDateString(lastCompletionDate);
  const todayStr = toWATDateString(todayWAT);
  const prevWeekStr = toWATDateString(new Date(todayWAT.getTime() - 7 * 24 * 60 * 60 * 1000));

  if (lastDateStr === prevWeekStr) {
    return currentStreak + 1; // consecutive week
  } else if (lastDateStr === todayStr) {
    return currentStreak; // same week - no change
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
  const prevWeekStr = toWATDateString(new Date(todayWAT.getTime() - 7 * 24 * 60 * 60 * 1000));
  // If last completion was before the previous week, streak should be reset
  return lastDateStr < prevWeekStr;
}

