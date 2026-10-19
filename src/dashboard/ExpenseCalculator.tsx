"use client";
import ExpensePlanner from "./ExpensePlanner";

const initialExpenses = [
  { head: "GMAT (exam + basics)", amount: 25000 },
  { head: "University applications / Uni-Assist", amount: 50000 },
  { head: "Transcripts", amount: 2000 },
  { head: "IELTS", amount: 18000 },
  { head: "APS", amount: 18000 },
  { head: "Passport", amount: 4000 },
  { head: "Semester contribution (low end)", amount: 22500 },
  { head: "Visa fee", amount: 7000 },
  { head: "Flight (one-way, budget)", amount: 30000 },
  { head: "Documents / notarization / courier", amount: 5000 },
  { head: "Accommodation (1st month)", amount: 70000 },
  { head: "Health insurance (first 2 months)", amount: 20000 },
  { head: "Initial setup (SIM, bedding, utensils)", amount: 18000 },
  { head: "Education loan processing fee", amount: 10000 },
];

export default function ExpenseCalculator() {
  return (
    <ExpensePlanner
      kind="expenses-inr"
      currency="INR"
      title="India preparation"
      subtitle="Before you leave · INR"
      defaults={initialExpenses}
    />
  );
}
