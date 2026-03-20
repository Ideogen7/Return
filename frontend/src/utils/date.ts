/**
 * Returns the minimum allowed return date (referenceDate + 2 days at 00:00:00).
 */
export function getMinReturnDate(referenceDate?: Date): Date {
  const base = referenceDate ?? new Date();
  const min = new Date(base);
  min.setDate(min.getDate() + 2);
  min.setHours(0, 0, 0, 0);
  return min;
}
