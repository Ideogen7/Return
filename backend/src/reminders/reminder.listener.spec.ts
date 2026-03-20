import { LOAN_EVENTS, LoanCreatedEvent } from '../common/events/loan.events.js';
import { ReminderListener } from './reminder.listener.js';
import { RemindersService } from './reminders.service.js';

describe('ReminderListener', () => {
  let listener: ReminderListener;
  let remindersService: { scheduleReminders: jest.Mock };

  beforeEach(() => {
    remindersService = { scheduleReminders: jest.fn().mockResolvedValue(undefined) };
    listener = new ReminderListener(remindersService as unknown as RemindersService);
  });

  describe(`@OnEvent(${LOAN_EVENTS.CREATED})`, () => {
    const event: LoanCreatedEvent = {
      loanId: '11111111-1111-1111-1111-111111111111',
      borrowerId: '22222222-2222-2222-2222-222222222222',
      lenderUserId: '33333333-3333-3333-3333-333333333333',
      returnDate: new Date('2026-04-10'),
      createdAt: new Date('2026-03-20'),
    };

    it('should call scheduleReminders with loan data', async () => {
      await listener.handleLoanCreated(event);

      expect(remindersService.scheduleReminders).toHaveBeenCalledWith(
        event.loanId,
        event.returnDate,
        event.createdAt,
      );
    });

    it('should call scheduleReminders even when returnDate is null', async () => {
      const noDateEvent: LoanCreatedEvent = { ...event, returnDate: null };

      await listener.handleLoanCreated(noDateEvent);

      expect(remindersService.scheduleReminders).toHaveBeenCalledWith(
        event.loanId,
        null,
        event.createdAt,
      );
    });
  });
});
