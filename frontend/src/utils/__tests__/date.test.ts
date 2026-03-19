import { getMinReturnDate } from '../date';

describe('getMinReturnDate', () => {
  it('should return a date 2 days from now', () => {
    const now = new Date();
    const result = getMinReturnDate();

    const expected = new Date(now);
    expected.setDate(expected.getDate() + 2);

    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });

  it('should set hours to 00:00:00.000', () => {
    const result = getMinReturnDate();

    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('should work with a custom reference date', () => {
    const ref = new Date(2026, 0, 10, 15, 30, 0); // 10 Jan 2026 15:30
    const result = getMinReturnDate(ref);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(12);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});
