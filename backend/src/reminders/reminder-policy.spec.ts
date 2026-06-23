import { ReminderType } from '@prisma/client';

import { ReminderPolicy, type ReminderSchedule } from './reminder-policy.js';

describe('ReminderPolicy', () => {
  describe('calculateDates', () => {
    const returnDate = new Date('2026-04-10');

    it('should return 5 reminders in chronological order', () => {
      const createdAt = new Date('2026-03-20');

      const result = ReminderPolicy.calculateDates(returnDate, createdAt);

      expect(result).toHaveLength(5);
    });

    it('should use J-3 for PREVENTIVE when Δ ≥ 3 days', () => {
      const createdAt = new Date('2026-03-20'); // Δ = 21 days ≥ 3

      const result = ReminderPolicy.calculateDates(returnDate, createdAt);

      expect(result[0]).toEqual<ReminderSchedule>({
        type: ReminderType.PREVENTIVE,
        scheduledFor: new Date('2026-04-07'), // J-3
      });
    });

    it('should NOT schedule a PREVENTIVE reminder when Δ < 3 days', () => {
      // FIX-05 vol. B: short loans (Δ < 3) get no preventive reminder —
      // the first relevant notification is ON_DUE_DATE (J).
      const createdAt = new Date('2026-04-08'); // Δ = 2 days < 3

      const result = ReminderPolicy.calculateDates(returnDate, createdAt);

      expect(result).toHaveLength(4);
      expect(result.some((r) => r.type === ReminderType.PREVENTIVE)).toBe(false);
      expect(result[0]).toEqual<ReminderSchedule>({
        type: ReminderType.ON_DUE_DATE,
        scheduledFor: returnDate, // J
      });
    });

    it('should schedule ON_DUE_DATE on the return date (J)', () => {
      const createdAt = new Date('2026-03-20');

      const result = ReminderPolicy.calculateDates(returnDate, createdAt);

      expect(result[1]).toEqual<ReminderSchedule>({
        type: ReminderType.ON_DUE_DATE,
        scheduledFor: returnDate, // J
      });
    });

    it('should schedule FIRST_OVERDUE at J+7', () => {
      const createdAt = new Date('2026-03-20');

      const result = ReminderPolicy.calculateDates(returnDate, createdAt);

      expect(result[2]).toEqual<ReminderSchedule>({
        type: ReminderType.FIRST_OVERDUE,
        scheduledFor: new Date('2026-04-17'), // J+7
      });
    });

    it('should schedule SECOND_OVERDUE at J+14', () => {
      const createdAt = new Date('2026-03-20');

      const result = ReminderPolicy.calculateDates(returnDate, createdAt);

      expect(result[3]).toEqual<ReminderSchedule>({
        type: ReminderType.SECOND_OVERDUE,
        scheduledFor: new Date('2026-04-24'), // J+14
      });
    });

    it('should schedule FINAL_OVERDUE at J+21', () => {
      const createdAt = new Date('2026-03-20');

      const result = ReminderPolicy.calculateDates(returnDate, createdAt);

      expect(result[4]).toEqual<ReminderSchedule>({
        type: ReminderType.FINAL_OVERDUE,
        scheduledFor: new Date('2026-05-01'), // J+21
      });
    });

    it('should return empty array when returnDate is null', () => {
      const createdAt = new Date('2026-03-20');

      const result = ReminderPolicy.calculateDates(null, createdAt);

      expect(result).toEqual([]);
    });

    it('should not schedule a PREVENTIVE reminder for a very short loan (Δ = 1 day)', () => {
      // FIX-05 vol. B: Δ = 1 day < 3 → no preventive at all.
      const tightCreatedAt = new Date('2026-04-09');

      const result = ReminderPolicy.calculateDates(returnDate, tightCreatedAt);

      expect(result.some((r) => r.type === ReminderType.PREVENTIVE)).toBe(false);
      expect(result[0].type).toBe(ReminderType.ON_DUE_DATE);
    });
  });
});
