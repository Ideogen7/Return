import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ReminderStatus, ReminderType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { RemindersService } from './reminders.service.js';
import { ReminderPolicy } from './reminder-policy.js';

describe('RemindersService', () => {
  let service: RemindersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    service = new RemindersService(prisma);
  });

  describe('scheduleReminders', () => {
    const LOAN_ID = '11111111-1111-1111-1111-111111111111';
    const RETURN_DATE = new Date('2026-04-10');
    const CREATED_AT = new Date('2026-03-20');

    it('should create 5 reminders in the database', async () => {
      await service.scheduleReminders(LOAN_ID, RETURN_DATE, CREATED_AT);

      expect(prisma.reminder.createMany).toHaveBeenCalledTimes(1);
      const call = prisma.reminder.createMany.mock.calls[0][0]!;
      expect((call.data as unknown[]).length).toBe(5);
    });

    it('should pass correct types and scheduledFor dates from ReminderPolicy', async () => {
      const expectedDates = ReminderPolicy.calculateDates(RETURN_DATE, CREATED_AT);

      await service.scheduleReminders(LOAN_ID, RETURN_DATE, CREATED_AT);

      const call = prisma.reminder.createMany.mock.calls[0][0]!;
      const data = call.data as Array<{
        loanId: string;
        type: ReminderType;
        status: ReminderStatus;
        scheduledFor: Date;
      }>;

      for (let i = 0; i < expectedDates.length; i++) {
        expect(data[i]).toEqual({
          loanId: LOAN_ID,
          type: expectedDates[i].type,
          status: ReminderStatus.SCHEDULED,
          scheduledFor: expectedDates[i].scheduledFor,
        });
      }
    });

    it('should not create any reminders when returnDate is null', async () => {
      await service.scheduleReminders(LOAN_ID, null, CREATED_AT);

      expect(prisma.reminder.createMany).not.toHaveBeenCalled();
    });
  });
});
