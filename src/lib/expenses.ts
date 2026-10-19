export const expenseCategories = [
  "Applications & tests",
  "Documents & visa",
  "Travel",
  "Housing",
  "Food",
  "Transport",
  "Insurance",
  "Other",
] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];
export type Expense = {
  head: string;
  amount: number;
  category?: ExpenseCategory;
};
export type Budget = { amount: string };
export const emptyBudget: Budget = { amount: "" };
export function isBudget(value: unknown): value is Budget {
  if (!value || typeof value !== "object") return false;
  const amount = (value as Budget).amount;
  return (
    typeof amount === "string" &&
    (amount === "" || parseAmount(amount) !== null)
  );
}
export function expenseCategory(expense: Expense): ExpenseCategory {
  if (expense.category) return expense.category;
  const name = expense.head.toLowerCase();
  if (/rent|accommodation|housing/.test(name)) return "Housing";
  if (/grocer|food/.test(name)) return "Food";
  if (/transport/.test(name)) return "Transport";
  if (/flight|travel/.test(name)) return "Travel";
  if (/insurance/.test(name)) return "Insurance";
  if (/passport|visa|aps|transcript|document/.test(name))
    return "Documents & visa";
  if (/gmat|ielts|application|uni-assist|semester/.test(name))
    return "Applications & tests";
  return "Other";
}
export function budgetBalance(target: number, total: number) {
  return (Math.round(target * 100) - Math.round(total * 100)) / 100;
}
export function parseAmount(value: string): number | null {
  const text = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  return Number.isFinite(amount) && amount <= 1_000_000_000 ? amount : null;
}
export function isExpenses(value: unknown): value is Expense[] {
  return (
    Array.isArray(value) &&
    value.length <= 500 &&
    value.every(
      (item) =>
        item &&
        typeof item.head === "string" &&
        item.head.trim().length > 0 &&
        item.head.length <= 200 &&
        (item.category === undefined ||
          expenseCategories.includes(item.category)) &&
        typeof item.amount === "number" &&
        parseAmount(String(item.amount)) !== null,
    )
  );
}
export function expenseTotal(expenses: Expense[]) {
  return (
    expenses.reduce((total, item) => total + Math.round(item.amount * 100), 0) /
    100
  );
}
