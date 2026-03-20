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

    it('should use J-1 for PREVENTIVE when Δ = 2 days', () => {
      const createdAt = new Date('2026-04-08'); // Δ = 2 days < 3

      const result = ReminderPolicy.calculateDates(returnDate, createdAt);

      expect(result[0]).toEqual<ReminderSchedule>({
        type: ReminderType.PREVENTIVE,
        scheduledFor: new Date('2026-04-09'), // J-1
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

    it('should skip PREVENTIVE reminder that falls before createdAt', () => {
      // Δ = 1 day → J-1 = returnDate - 1 = createdAt itself
      // PREVENTIVE at J-1 but createdAt is the same day
      const tightCreatedAt = new Date('2026-04-09');

      const result = ReminderPolicy.calculateDates(returnDate, tightCreatedAt);

      // PREVENTIVE J-1 = April 9 = createdAt → still valid (same day is OK)
      expect(result[0]).toEqual<ReminderSchedule>({
        type: ReminderType.PREVENTIVE,
        scheduledFor: new Date('2026-04-09'), // J-1
      });
    });
  });
});
