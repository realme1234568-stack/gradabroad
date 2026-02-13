"use client";
import React, { useState } from "react";
import emailjs from '@emailjs/browser';
import { useUser } from "@/lib/UserContext";
import { Card, Button, Input, Divider } from "@mui/material";

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
  const [expenses, setExpenses] = useState(initialExpenses);
  const { email } = useUser ? useUser() : { email: null };
  const [exporting, setExporting] = useState(false);
  const [newHead, setNewHead] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editHead, setEditHead] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const handleAddExpense = () => {
    if (!newHead || !newAmount) return;
    setExpenses([
      ...expenses,
      { head: newHead, amount: parseInt(newAmount, 10) },
    ]);
    setNewHead("");
    setNewAmount("");
  };

  const handleEditExpense = (idx: number) => {
    setEditIdx(idx);
    setEditHead(expenses[idx].head);
    setEditAmount(expenses[idx].amount.toString());
  };

  const handleSaveEdit = () => {
    if (editIdx === null) return;
    const updated = [...expenses];
    updated[editIdx] = { head: editHead, amount: parseInt(editAmount, 10) };
    setExpenses(updated);
    setEditIdx(null);
    setEditHead("");
    setEditAmount("");
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExport = async () => {
    if (!email) {
      alert("No email found. Please log in.");
      return;
    }
    if (!window.confirm(`Are you sure you want to export this to the given email id - ${email}?`)) return;
    setExporting(true);
    const expenseList = expenses.map(e => `${e.head}: ${e.amount}`).join("\n");
    const templateParams = {
      to_email: email,
      user_name: "User", // Optionally use a real name if available
      subject: "Your Exported Expenses",
      message: `Expense List:\n${expenseList}\nTotal: ${total}`,
    };
    console.log("Exporting with templateParams:", templateParams);
    try {
      await emailjs.send(
        'service_9u7fx3n',
        'template_id6lw8p',
        templateParams,
        'hAzYMGuWTckYlKD63'
      );
      alert("Exported to your email!");
    } catch (err) {
      console.error("EmailJS error:", err);
      alert("Failed to send email. Please try again later.");
    }
    setExporting(false);
  };
  return (
    <Card
      sx={{
        background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        borderRadius: 3,
        boxShadow: 3,
        padding: 5,
        maxWidth: 600,
        margin: "auto",
      }}
    >
      <h3 style={{ fontWeight: 700, color: "#333", marginBottom: 8 }}>My Expense Calculator</h3>
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
            <div style={{ flex: 2 }}>
              {editIdx === idx ? (
                <Input
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
                  value={editAmount}
                  type="number"
                  onChange={e => setEditAmount(e.target.value)}
                  sx={{ width: '80px', marginBottom: 1 }}
                />
              ) : (
                <span style={{ color: "#4a90e2", fontWeight: 600, width: '80px', textAlign: 'right', display: 'block' }}>{exp.amount.toLocaleString()}</span>
              )}
              {editIdx === idx ? (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  sx={{ minWidth: 36, borderRadius: 2, marginTop: 1 }}
                  onClick={handleSaveEdit}
                >
                  ✓
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ minWidth: 36, borderRadius: 2, marginLeft: 8 }}
                  onClick={() => handleEditExpense(idx)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <Divider sx={{ marginBottom: 2 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: "#222" }}>Total</span>
        <span style={{ fontWeight: 700, color: "#e94e77" }}>{total.toLocaleString()}</span>
      </div>
      <div style={{ background: "#fff", borderRadius: 6, padding: 10, marginBottom: 8, boxShadow: "0 1px 4px #eee" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <Input
            placeholder="Expense head"
            value={newHead}
            onChange={e => setNewHead(e.target.value)}
            sx={{ flex: 2 }}
          />
          <Input
            placeholder="Amount"
            type="number"
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            color="success"
            size="small"
            sx={{ minWidth: 36, borderRadius: 2 }}
            onClick={handleAddExpense}
          >
            ✓
          </Button>
        </div>
        <span style={{ fontSize: 12, color: "#888" }}>Add expense</span>
      </div>
      <button
        onClick={handleExport}
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
        {exporting ? 'Exporting...' : 'Export'}
      </button>
    </Card>
  );
}
