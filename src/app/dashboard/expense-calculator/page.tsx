"use client";

import ExpenseCalculator from '../../../dashboard/ExpenseCalculator';
import GermanyLivingExpenseCalculator from '../../../dashboard/GermanyLivingExpenseCalculator';

export default function ExpenseCalculatorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl font-bold mb-8 text-center">Expense Calculators</h1>
      <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
        <div className="flex-1 min-w-0 w-full">
          <ExpenseCalculator />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <GermanyLivingExpenseCalculator />
        </div>
      </div>
    </div>
  );
}
