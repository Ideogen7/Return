import { getMinReturnDate } from '../date';

describe('getMinReturnDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 19, 14, 30, 0)); // 19 Mar 2026 14:30
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return a date 2 days from now', () => {
    const result = getMinReturnDate();

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(21);
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

  it('should handle month transition (30 Jan + 2 = 1 Feb)', () => {
    const ref = new Date(2026, 0, 30); // 30 Jan 2026
    const result = getMinReturnDate(ref);

    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(1);
  });

  it('should handle year transition (30 Dec + 2 = 1 Jan next year)', () => {
    const ref = new Date(2026, 11, 30); // 30 Dec 2026
    const result = getMinReturnDate(ref);

    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('should handle leap year (27 Feb 2028 + 2 = 29 Feb)', () => {
    const ref = new Date(2028, 1, 27); // 27 Feb 2028 (leap year)
    const result = getMinReturnDate(ref);

    expect(result.getMonth()).toBe(1); // Still February
    expect(result.getDate()).toBe(29);
  });

  it('should handle non-leap year (27 Feb 2026 + 2 = 1 Mar)', () => {
    const ref = new Date(2026, 1, 27); // 27 Feb 2026
    const result = getMinReturnDate(ref);

    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBe(1);
  });

  it('should not mutate the reference date', () => {
    const ref = new Date(2026, 0, 10, 15, 30, 0);
    const originalTime = ref.getTime();
    getMinReturnDate(ref);

    expect(ref.getTime()).toBe(originalTime);
  });
});
