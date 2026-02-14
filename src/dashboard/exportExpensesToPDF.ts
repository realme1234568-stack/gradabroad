// jsPDF is a popular library for client-side PDF generation
// This file will be used to encapsulate PDF export logic for expenses
import jsPDF from 'jspdf';

export function exportExpensesToPDF(expenses, total, title = 'Exported Expenses') {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(12);
  let y = 35;
  expenses.forEach((e, idx) => {
    doc.text(`${idx + 1}. ${e.head}: ${typeof total === 'number' && title.includes('Germany') ? '€' : '₹'}${e.amount}`, 14, y);
    y += 8;
  });
  doc.setFontSize(14);
  doc.text(`Total: ${typeof total === 'number' && title.includes('Germany') ? '€' : '₹'}${total}`, 14, y + 8);
  doc.save((title.replace(/\s+/g, '_').toLowerCase() || 'expenses') + '.pdf');
}
