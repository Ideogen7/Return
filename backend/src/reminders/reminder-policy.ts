import { ReminderType } from '@prisma/client';

export interface ReminderSchedule {
  type: ReminderType;
  scheduledFor: Date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  return Math.floor((a.getTime() - b.getTime()) / msPerDay);
}

export const ReminderPolicy = {
  /**
   * Calculate the 5 reminder dates based on the return date.
   * Policy: PREVENTIVE (J-3 if Δ≥3, else J-1), ON_DUE_DATE (J),
   * FIRST_OVERDUE (J+7), SECOND_OVERDUE (J+14), FINAL_OVERDUE (J+21).
   */
  calculateDates(returnDate: Date | null, createdAt: Date): ReminderSchedule[] {
    if (!returnDate) return [];

    const delta = diffDays(returnDate, createdAt);
    const preventiveOffset = delta >= 3 ? -3 : -1;

    return [
      { type: ReminderType.PREVENTIVE, scheduledFor: addDays(returnDate, preventiveOffset) },
      { type: ReminderType.ON_DUE_DATE, scheduledFor: new Date(returnDate) },
      { type: ReminderType.FIRST_OVERDUE, scheduledFor: addDays(returnDate, 7) },
      { type: ReminderType.SECOND_OVERDUE, scheduledFor: addDays(returnDate, 14) },
      { type: ReminderType.FINAL_OVERDUE, scheduledFor: addDays(returnDate, 21) },
    ];
  },
} as const;
