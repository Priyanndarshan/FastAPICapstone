export function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dDay = new Date(d);
  dDay.setHours(0, 0, 0, 0);
  if (dDay.getTime() === today.getTime()) return "Today";
  if (dDay.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatMonthYear(month: number, year: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function countExpensesInMonth(
  expenses: { date: string }[],
  month: number,
  year: number
): number {
  return expenses.filter((e) => {
    const [y, m] = e.date.split("-").map(Number);
    return y === year && m === month;
  }).length;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (ISO_DATE_RE.test(trimmed)) return trimmed;
  // Accept datetime-like strings by taking the date prefix (e.g. 2026-03-17T00:00:00Z)
  const prefix = trimmed.slice(0, 10);
  return ISO_DATE_RE.test(prefix) ? prefix : undefined;
}
