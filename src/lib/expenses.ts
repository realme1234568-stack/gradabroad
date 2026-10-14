export type Expense = { head: string; amount: number };
export function parseAmount(value: string): number | null {
  const text = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  return Number.isFinite(amount) && amount <= 1_000_000_000 ? amount : null;
}
export function isExpenses(value: unknown): value is Expense[] {
  return Array.isArray(value) && value.length <= 500 && value.every(item =>
    item && typeof item.head === "string" && item.head.trim().length > 0 && item.head.length <= 200 &&
    typeof item.amount === "number" && parseAmount(String(item.amount)) !== null
  );
}
export function expenseTotal(expenses: Expense[]) {
  return expenses.reduce((total, item) => total + Math.round(item.amount * 100), 0) / 100;
}
