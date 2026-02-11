import React from "react";
import ExpenseCalculator from "./ExpenseCalculator";

export default function DashboardPage() {
  return (
    <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Your Dashboard</h2>
      {/* Other dashboard boxes like My Shortlist, My Tracker, etc. */}
      <div style={{ marginBottom: 32 }}>
        {/* ...existing dashboard boxes... */}
      </div>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <ExpenseCalculator />
      </div>
    </div>
  );
}
