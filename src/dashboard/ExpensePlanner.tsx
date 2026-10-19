"use client";
import { useState } from "react";
import { useAccountData } from "@/lib/accountData";
import {
  budgetBalance,
  emptyBudget,
  expenseCategories,
  expenseCategory,
  expenseTotal,
  isBudget,
  isExpenses,
  parseAmount,
  type Expense,
  type ExpenseCategory,
} from "@/lib/expenses";
import { exportExpensesToPDF } from "./exportExpensesToPDF";
import { Wallet, Plus, ArrowUpRight } from "@/components/LandingIcons";
import s from "./expenses.module.css";

function BudgetPanel({
  kind,
  total,
  currency,
  expensesReady,
}: {
  kind: "budget-inr" | "budget-eur";
  total: number;
  currency: "INR" | "EUR";
  expensesReady: boolean;
}) {
  const budget = useAccountData(kind, emptyBudget, isBudget);
  const target = parseAmount(budget.value.amount);
  const balance = target === null ? null : budgetBalance(target, total);
  const money = (amount: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  return (
    <section className={s.budget} aria-label="Budget planning">
      <div className={s.sectionLabel}>
        <span>YOUR BUDGET</span>
        <span>
          {budget.dirty
            ? "Unsaved target"
            : budget.ready
              ? budget.value.amount === ""
                ? "No target set"
                : "Saved to your account"
              : ""}
        </span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void budget.save();
        }}
        className={s.budgetForm}
      >
        <label>
          <span>Target ({currency})</span>
          <input
            aria-label="Budget target"
            type="number"
            min="0"
            step="0.01"
            placeholder="Set your limit"
            value={budget.value.amount}
            disabled={!budget.ready || budget.saving}
            onChange={(event) =>
              budget.setValue({ amount: event.target.value })
            }
          />
        </label>
        <button
          className="ga-primary"
          disabled={
            !budget.ready ||
            budget.saving ||
            !budget.dirty ||
            !isBudget(budget.value)
          }
        >
          {budget.saving ? "Saving…" : "Save target"}
        </button>
      </form>
      {budget.error && <p role="alert">{budget.error}</p>}
      <div className={s.budgetSummary}>
        {balance !== null && expensesReady ? (
          <>
            <span>{balance < 0 ? "Over budget" : "Remaining budget"}</span>
            <strong data-over={balance < 0}>{money(Math.abs(balance))}</strong>
          </>
        ) : (
          <span>
            {budget.loading
              ? "Loading your budget…"
              : "Set a target to see how your plan compares."}
          </span>
        )}
      </div>
      <div className={s.track} aria-hidden="true">
        <span
          data-over={balance !== null && balance < 0}
          style={{
            width:
              target === null || !expensesReady
                ? "0%"
                : `${target === 0 ? (total > 0 ? 100 : 0) : Math.min(100, (total / target) * 100)}%`,
          }}
        />
      </div>
      <p className={s.hint}>
        {budget.dirty ? "Preview based on your unsaved target. " : ""}Leave the
        target blank and save to clear it.
      </p>
    </section>
  );
}

type PlannerProps = {
  kind: "expenses-inr" | "expenses-eur";
  currency: "INR" | "EUR";
  title: string;
  subtitle: string;
  defaults: Expense[];
};

export default function ExpensePlanner(props: PlannerProps) {
  const account = useAccountData(props.kind, props.defaults, isExpenses);
  // A different account gets a new editor, never the previous person's drafts.
  return (
    <PlannerContent
      key={account.ownerId ?? "signed-out"}
      {...props}
      account={account}
    />
  );
}

function PlannerContent({
  currency,
  title,
  subtitle,
  defaults,
  account,
}: PlannerProps & {
  account: ReturnType<typeof useAccountData<Expense[]>>;
}) {
  const { value: expenses, save, loading, saving, error, ready } = account;
  const [validationError, setValidationError] = useState<string | null>(null);
  const [newHead, setNewHead] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Other");
  const [filter, setFilter] = useState("All categories");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editHead, setEditHead] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<ExpenseCategory>("Other");
  const [exporting, setExporting] = useState(false);
  const total = expenseTotal(expenses);
  const format = (amount: number) =>
    amount.toLocaleString("en", { maximumFractionDigits: 2 });
  const visible = expenses
    .map((expense, index) => ({ expense, index }))
    .filter(
      ({ expense }) =>
        filter === "All categories" || expenseCategory(expense) === filter,
    );
  const breakdown = expenseCategories
    .map((name) => ({
      name,
      total: expenseTotal(
        expenses.filter((expense) => expenseCategory(expense) === name),
      ),
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
  async function submit(edit: boolean) {
    const head = (edit ? editHead : newHead).trim();
    const amount = parseAmount(edit ? editAmount : newAmount);
    if (!head || head.length > 200 || amount === null) {
      setValidationError(
        "Enter a name and an amount from 0 to 1,000,000,000 with at most two decimal places.",
      );
      return;
    }
    if (!edit && expenses.length >= 500) {
      setValidationError("You can save up to 500 expenses per calculator.");
      return;
    }
    setValidationError(null);
    const item = { head, amount, category: edit ? editCategory : category };
    const next = edit
      ? expenses.map((expense, index) => (index === editIdx ? item : expense))
      : [...expenses, item];
    if (await save(next)) {
      if (edit) setEditIdx(null);
      else {
        setNewHead("");
        setNewAmount("");
      }
    }
  }
  function exportPDF() {
    setExporting(true);
    try {
      exportExpensesToPDF(
        expenses,
        total,
        currency === "EUR"
          ? "Germany Living Expenses"
          : "India Preparation Expenses",
      );
    } catch {
      setValidationError("Could not create the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <article className={s.card} aria-label={title}>
      <header className={s.heading}>
        <div>
          <p>{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <span className={s.currency}>
          <Wallet />
          {currency}
        </span>
      </header>
      <div className={s.total}>
        <span>
          {currency === "EUR" ? "MONTHLY ESTIMATE" : "PREPARATION ESTIMATE"}
        </span>
        <strong>
          {format(total)} {currency === "EUR" ? "€" : "₹"}
        </strong>
        <p>
          {expenses.length} planned expenses ·{" "}
          {ready ? "Your saved plan" : "Illustrative starting amounts"}
        </p>
      </div>
      <div className={s.status} aria-live="polite">
        {loading ? (
          <p>Loading saved expenses…</p>
        ) : saving ? (
          <p>Saving changes…</p>
        ) : (
          <p>Confirm an add or edit to save it to your account.</p>
        )}
        {(validationError || error) && (
          <p role="alert">{validationError || error}</p>
        )}
      </div>
      <BudgetPanel
        kind={currency === "EUR" ? "budget-eur" : "budget-inr"}
        total={total}
        currency={currency}
        expensesReady={ready}
      />
      <div className={s.sectionLabel}>
        <span>EXPENSES</span>
        <span>
          {visible.length} of {expenses.length}
        </span>
      </div>
      <label className={s.filter}>
        Filter by category
        <select
          aria-label="Filter by category"
          disabled={editIdx !== null}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option>All categories</option>
          {expenseCategories.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <fieldset disabled={!ready || saving} className={s.expenseFields}>
        <div
          className={s.list}
          tabIndex={0}
          aria-label={`${title} expense list`}
        >
          {!visible.length && (
            <p className={s.empty}>No expenses in this category.</p>
          )}
          {visible.map(({ expense, index }) => (
            <div className={s.row} key={index}>
              {editIdx === index ? (
                <form
                  className={s.editForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit(true);
                  }}
                >
                  <input
                    aria-label="Edit expense name"
                    value={editHead}
                    maxLength={200}
                    onChange={(event) => setEditHead(event.target.value)}
                  />
                  <input
                    aria-label="Edit expense amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editAmount}
                    onChange={(event) => setEditAmount(event.target.value)}
                  />
                  <select
                    aria-label="Edit expense category"
                    value={editCategory}
                    onChange={(event) =>
                      setEditCategory(event.target.value as ExpenseCategory)
                    }
                  >
                    {expenseCategories.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                  <div>
                    <button className="ga-primary" aria-label="Save expense">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditIdx(null);
                        setValidationError(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className={s.rowName}>
                    <strong>{expense.head}</strong>
                    <span>{expenseCategory(expense)}</span>
                  </div>
                  <div className={s.rowActions}>
                    <strong>{format(expense.amount)}</strong>
                    <div>
                      <button
                        type="button"
                        disabled={editIdx !== null}
                        onClick={() => {
                          setEditIdx(index);
                          setEditHead(expense.head);
                          setEditAmount(String(expense.amount));
                          setEditCategory(expenseCategory(expense));
                        }}
                      >
                        Edit
                      </button>
                      {index >= defaults.length && (
                        <button
                          type="button"
                          disabled={editIdx !== null}
                          onClick={() =>
                            void save(expenses.filter((_, i) => i !== index))
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <form
          className={s.addForm}
          onSubmit={(event) => {
            event.preventDefault();
            void submit(false);
          }}
        >
          <label>
            Expense name
            <input
              aria-label="Expense name"
              placeholder="e.g. Course materials"
              maxLength={200}
              value={newHead}
              onChange={(event) => setNewHead(event.target.value)}
            />
          </label>
          <div className={s.addColumns}>
            <label>
              Amount ({currency})
              <input
                aria-label="Expense amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
              />
            </label>
            <label>
              Category
              <select
                aria-label="Expense category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as ExpenseCategory)
                }
              >
                {expenseCategories.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>
          <button className="ga-primary" aria-label="Add expense">
            <Plus /> Add expense
          </button>
        </form>
      </fieldset>
      <section className={s.breakdown} aria-label="Spending breakdown">
        <div className={s.sectionLabel}>
          <span>WHERE YOUR BUDGET GOES</span>
          <span>All expenses</span>
        </div>
        <div className={s.breakdownRows}>
          {breakdown.length ? (
            breakdown.map((item) => (
              <div key={item.name}>
                <div>
                  <span>{item.name}</span>
                  <strong>{Math.round((item.total / total) * 100)}%</strong>
                </div>
                <div className={s.track}>
                  <span style={{ width: `${(item.total / total) * 100}%` }} />
                </div>
                <small>
                  {format(item.total)} {currency}
                </small>
              </div>
            ))
          ) : (
            <p>No spending to show yet.</p>
          )}
        </div>
      </section>
      <footer className={s.footer}>
        <p>
          Starting amounts are editable examples, not current price estimates.{" "}
          {currency === "EUR"
            ? "Monthly costs are separate from your preparation plan."
            : "Check for costs already included in your monthly plan."}
        </p>
        <button
          className="ga-primary"
          disabled={!ready || saving || exporting}
          onClick={exportPDF}
        >
          {exporting ? "Preparing PDF…" : "Download PDF"}
          <ArrowUpRight />
        </button>
      </footer>
    </article>
  );
}
