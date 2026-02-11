"use client";
import ExpenseCalculator from '../../../dashboard/ExpenseCalculator';

export default function ExpenseCalculatorPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold mb-6">My Expense Calculator</h1>
      <ExpenseCalculator />
    </div>
  );
}
