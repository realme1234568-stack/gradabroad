"use client";

import ExpenseCalculator from '../../../dashboard/ExpenseCalculator';
import GermanyLivingExpenseCalculator from '../../../dashboard/GermanyLivingExpenseCalculator';

export default function ExpenseCalculatorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-bold mb-8 text-center">Expense Calculators</h1>
      <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
        <div className="flex-1 min-w-[320px]">
          <ExpenseCalculator />
        </div>
        <div className="flex-1 min-w-[320px]">
          <GermanyLivingExpenseCalculator />
        </div>
      </div>
    </div>
  );
}
