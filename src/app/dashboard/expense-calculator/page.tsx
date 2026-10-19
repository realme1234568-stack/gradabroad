"use client";

import ExpenseCalculator from '../../../dashboard/ExpenseCalculator';
import GermanyLivingExpenseCalculator from '../../../dashboard/GermanyLivingExpenseCalculator';

export default function ExpenseCalculatorPage() {
  return (
    <div className="app-page mx-auto w-full max-w-6xl px-3 sm:px-6 py-8 sm:py-12">
      <p className="page-eyebrow">PLAN WITH PERSPECTIVE</p>
      <h1 className="text-2xl font-bold mb-8">Expense Calculators</h1>
      <p className="mb-8 text-muted">Plan your preparation costs in rupees and monthly living costs in euros. Set separate targets and see where your money goes.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="min-w-0 w-full">
          <ExpenseCalculator />
        </div>
        <div className="min-w-0 w-full">
          <GermanyLivingExpenseCalculator />
        </div>
      </div>
    </div>
  );
}
