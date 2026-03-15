import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Category, Expense } from "../types";

function getCategoryName(categoryId: number | null, categories: Category[]): string {
    if (categoryId == null) return "";
    return categories.find((c) => c.id === categoryId)?.name ?? "";
}

function csvEscape(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function exportExpensesToCSV(expenses: Expense[], categories: Category[]): void {
    const headers = ["Date", "Type", "Category", "Payment Mode", "Amount", "Notes", "Recurring"];
    const rows = expenses.map((e) => [
        e.date,
        e.transaction_type === "in" ? "Cash In" : "Cash Out",
        getCategoryName(e.category_id, categories),
        e.payment_mode,
        e.amount,
        e.notes ?? "",
        e.is_recurring ? (e.recurrence_period ?? "Yes") : "No",
    ]);
    const lineToCsv = (cells: string[]) => cells.map(csvEscape).join(",");
    const csv = [lineToCsv(headers), ...rows.map((r) => lineToCsv(r.map(String)))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportExpensesToExcel(expenses: Expense[], categories: Category[]): void {
    const rows = expenses.map((e) => ({
        Date: e.date,
        Type: e.transaction_type === "in" ? "Cash In" : "Cash Out",
        Category: getCategoryName(e.category_id, categories),
        "Payment Mode": e.payment_mode,
        Amount: e.amount,
        Notes: e.notes ?? "",
        Recurring: e.is_recurring ? (e.recurrence_period ?? "Yes") : "No",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Expenses");
    XLSX.writeFile(workbook, `expenses-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportExpensesToPDF(expenses: Expense[], categories: Category[]): void {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = ["Date", "Type", "Category", "Payment Mode", "Amount", "Notes", "Recurring"];
    const rows = expenses.map((e) => [
        e.date,
        e.transaction_type === "in" ? "Cash In" : "Cash Out",
        getCategoryName(e.category_id, categories),
        e.payment_mode,
        e.amount,
        e.notes ?? "",
        e.is_recurring ? (e.recurrence_period ?? "Yes") : "No",
    ]);
    autoTable(doc, {
        head: [headers],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [109, 40, 217] },
    });
    doc.save(`expenses-${new Date().toISOString().slice(0, 10)}.pdf`);
}
