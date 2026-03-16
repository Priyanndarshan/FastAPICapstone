import { useEffect, useState } from "react";
import * as expensesApi from "../../api/expenses";
import type { ExpenseFilters, ExpensePayload } from "../../api/expenses";
import type { Expense } from "../../types";
import { parseApiError } from "../../utils/parseApiError";

const AMOUNT_ERROR = "Enter a valid amount.";
const ISO_DATE_RE = /^\\d{4}-\\d{2}-\\d{2}$/;

function validateAmount(amount: string): string {
    const trimmed = amount.trim();
    if (!trimmed) throw new Error(AMOUNT_ERROR);
    const num = Number(trimmed);
    if (isNaN(num) || num <= 0) throw new Error(AMOUNT_ERROR);
    return trimmed;
}

function normalizeIsoDate(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (ISO_DATE_RE.test(trimmed)) return trimmed;
    // Accept datetime-like strings by taking the date prefix (e.g. 2026-03-17T00:00:00Z)
    const prefix = trimmed.slice(0, 10);
    return ISO_DATE_RE.test(prefix) ? prefix : undefined;
}

export function useExpenses(initialFilters?: ExpenseFilters) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchExpenses(initialFilters);
    }, []);

    async function fetchExpenses(filters?: ExpenseFilters) {
        setLoading(true);
        setError("");
        try {
            const data = await expensesApi.getExpenses(filters);
            setExpenses(data);
        } catch (err) {
            setError(parseApiError(err, "Failed to load expenses."));
        } finally {
            setLoading(false);
        }
    }

    async function addExpense(payload: ExpensePayload) {
        const amount = validateAmount(payload.amount);
        const date = normalizeIsoDate(payload.date);
        if (!date) throw new Error("Enter a valid date.");
        try {
            const expense = await expensesApi.createExpense({
                ...payload,
                amount,
                date,
                category_id: payload.category_id ?? null,
                payment_mode: payload.payment_mode ?? "CASH",
                transaction_type: payload.transaction_type ?? "out",
                notes: payload.notes || null,
                recurrence_period: payload.is_recurring
                    ? (payload.recurrence_period && payload.recurrence_period.trim() ? payload.recurrence_period : null)
                    : null,
            });
            setExpenses((prev) => [expense, ...prev]);
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add expense."));
        }
    }

    async function updateExpense(id: number, payload: Partial<ExpensePayload>) {
        const amount = validateAmount(payload.amount ?? "");
        const date = normalizeIsoDate(payload.date);
        try {
            const updateBody: Partial<ExpensePayload> = {
                ...payload,
                amount,
                category_id: payload.category_id ?? null,
                payment_mode: payload.payment_mode ?? "CASH",
                transaction_type: payload.transaction_type ?? "out",
                notes: payload.notes || null,
                recurrence_period: payload.is_recurring
                    ? (payload.recurrence_period && payload.recurrence_period.trim() ? payload.recurrence_period : null)
                    : null,
            };
            // Only send `date` if it's a valid ISO date; otherwise omit to avoid 422s.
            if (date) updateBody.date = date;
            else delete (updateBody as { date?: unknown }).date;

            const expense = await expensesApi.updateExpense(id, updateBody);
            setExpenses((prev) => prev.map((e) => (e.id === id ? expense : e)));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to update expense."));
        }
    }

    async function removeExpense(id: number) {
        try {
            await expensesApi.deleteExpense(id);
            setExpenses((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to delete expense."));
        }
    }

    return {
        expenses,
        loading,
        error,
        refetch: fetchExpenses,
        addExpense,
        updateExpense,
        removeExpense,
    };
}
