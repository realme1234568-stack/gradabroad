import React, { useState } from "react";
import { exportExpensesToPDF } from './exportExpensesToPDF';
import { useAccountData } from "@/lib/accountData";
import { parseAmount, isExpenses, expenseTotal } from "@/lib/expenses";
import { Card, Button, Input, Divider } from "@mui/material";

const defaultGermanyExpenses = [
  { head: "Rent", amount: 400 },
  { head: "Groceries", amount: 200 },
  { head: "Transport", amount: 100 },
  { head: "Misc", amount: 100 },
];

export default function GermanyLivingExpenseCalculator() {
  const { value: expenses, save, loading, saving, error, ready } = useAccountData("expenses-eur", defaultGermanyExpenses, isExpenses);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [newHead, setNewHead] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editHead, setEditHead] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const handleAddExpense = async () => {
    const amount = parseAmount(newAmount);
    if (!newHead.trim() || newHead.trim().length > 200 || amount === null) {
      setValidationError("Enter a name and an amount from 0 to 1,000,000,000 with at most two decimal places.");
      return;
    }
    setValidationError(null);
    if (await save([...expenses, { head: newHead.trim(), amount }])) {
      setNewHead("");
      setNewAmount("");
    }
  };

  const handleEditExpense = (idx: number) => {
    setEditIdx(idx);
    setEditHead(expenses[idx].head);
    setEditAmount(expenses[idx].amount.toString());
  };

  const handleSaveEdit = async () => {
    if (editIdx === null) return;
    const amount = parseAmount(editAmount);
    if (!editHead.trim() || editHead.trim().length > 200 || amount === null) {
      setValidationError("Enter a name and an amount from 0 to 1,000,000,000 with at most two decimal places.");
      return;
    }
    setValidationError(null);
    const updated = [...expenses];
    updated[editIdx] = { head: editHead.trim(), amount };
    if (await save(updated)) {
      setEditIdx(null);
      setEditHead("");
      setEditAmount("");
    }
  };

  const handleRemove = async (idx: number) => {
    setValidationError(null);
    await save(expenses.filter((_, i) => i !== idx));
  };

  const total = expenseTotal(expenses);

  const handleDownloadPDF = () => {
    setExporting(true);
    try {
      exportExpensesToPDF(expenses, total, 'Germany Living Expenses');
    } finally {
      setExporting(false);
    }
  };
  return (
    <fieldset disabled={!ready || saving} className="w-full min-w-0 border-0 p-0">
    <Card
      sx={{
        background: "linear-gradient(135deg, #f9f7ff 0%, #ffe6fa 100%)",
        borderRadius: 4,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
        padding: { xs: 2, sm: 6 },
        maxWidth: 520,
        minWidth: 0,
        width: '100%',
        margin: "auto",
        border: '1.5px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
      }}
    >
      <h3 style={{ fontWeight: 700, color: "#333", marginBottom: 8 }}>Germany Living Expenses</h3>
      {loading && <p role="status">Loading saved expenses…</p>}
      {(validationError || error) && <p role="alert">{validationError || error}</p>}
      <p role="status">{saving ? "Saving…" : ready ? "Changes are saved to your account after adding or editing an expense." : ""}</p>
      <Divider sx={{ marginBottom: 2 }} />
      <div style={{ maxHeight: 350, overflowY: "auto", marginBottom: 16 }}>
        {expenses.map((exp, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 6,
              background: "rgba(255,255,255,0.7)",
              borderRadius: 6,
              padding: "6px 10px",
            }}
          >
            <div style={{ flex: 2, minWidth: 0, overflowWrap: "anywhere" }}>
              {editIdx === idx ? (
                <Input
                  inputProps={{ "aria-label": "Edit expense name", maxLength: 200 }}
                  value={editHead}
                  onChange={e => setEditHead(e.target.value)}
                  sx={{ width: '100%' }}
                />
              ) : (
                <span style={{ fontWeight: 500 }}>{exp.head}</span>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {editIdx === idx ? (
                <Input
                  inputProps={{ "aria-label": "Edit expense amount", min: 0, step: "0.01" }}
                  value={editAmount}
                  type="number"
                  onChange={e => setEditAmount(e.target.value)}
                  sx={{ width: '80px', marginBottom: 1 }}
                />
              ) : (
                <span style={{ color: "#e94e77", fontWeight: 600, minWidth: '80px', textAlign: 'right', display: 'block' }}>{exp.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              )}
              {editIdx === idx ? (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  sx={{ minWidth: 36, borderRadius: 2, marginTop: 1 }}
                  aria-label="Save expense"
                  onClick={handleSaveEdit}
                >
                  ✓
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{ minWidth: 36, borderRadius: 2, marginLeft: 1 }}
                    onClick={() => handleEditExpense(idx)}
                  >
                    Edit
                  </Button>
                  {idx >= 4 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ minWidth: 36, borderRadius: 2, marginLeft: 0 }}
                      onClick={() => handleRemove(idx)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Divider sx={{ marginBottom: 2 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: "#222" }}>Total</span>
        <span style={{ fontWeight: 700, color: "#e94e77" }}>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })} €</span>
      </div>
      <div style={{ background: "#fff", borderRadius: 6, padding: 10, marginBottom: 8, boxShadow: "0 1px 4px #eee" }}>
        <div className="flex flex-col gap-2 mb-1.5 sm:flex-row">
          <Input
            placeholder="Expense head" inputProps={{ "aria-label": "Expense name", maxLength: 200 }}
            value={newHead}
            onChange={e => setNewHead(e.target.value)}
            sx={{ flex: 2, minWidth: 0, width: "100%" }}
          />
          <Input
            placeholder="Amount" inputProps={{ "aria-label": "Expense amount", min: 0, step: "0.01" }}
            type="number"
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
            sx={{ flex: 1, minWidth: 0, width: "100%" }}
          />
          <Button
            variant="contained"
            color="success"
            size="small"
            sx={{ minWidth: 36, borderRadius: 2 }}
            aria-label="Add expense"
            onClick={handleAddExpense}
          >
            ✓
          </Button>
        </div>
        <span style={{ fontSize: 12, color: "#888" }}>Add expense</span>
      </div>
      <button
        onClick={handleDownloadPDF}
        disabled={exporting}
        style={{
          marginTop: 16,
          width: '100%',
          background: 'linear-gradient(90deg, #34d399 0%, #06b6d4 100%)',
          color: '#fff',
          fontWeight: 700,
          border: 'none',
          borderRadius: 8,
          padding: '12px 0',
          fontSize: 16,
          cursor: exporting ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px #a7f3d0',
          transition: 'background 0.2s',
        }}
      >
        {exporting ? 'Preparing PDF...' : 'Download PDF'}
      </button>
    </Card>
    </fieldset>
  );
}
