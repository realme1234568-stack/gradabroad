"use client";
import ExpensePlanner from "./ExpensePlanner";

const defaultGermanyExpenses = [
  { head: "Rent", amount: 400 },
  { head: "Groceries", amount: 200 },
  { head: "Transport", amount: 100 },
  { head: "Misc", amount: 100 },
];

export default function GermanyLivingExpenseCalculator() {
  return (
    <ExpensePlanner
      kind="expenses-eur"
      currency="EUR"
      title="Germany living costs"
      subtitle="Monthly plan · EUR"
      defaults={defaultGermanyExpenses}
    />
  );
}
