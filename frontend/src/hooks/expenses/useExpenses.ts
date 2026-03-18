import { useEffect, useState } from "react";
import * as expensesApi from "../../api/expenses";
import type { ExpenseFilters, ExpensePayload } from "../../api/expenses";
import type { Expense } from "../../types";
import { parseApiError } from "../../utils/parseApiError";

// Shared validation message for amount inputs (used by add + update).
const AMOUNT_ERROR = "Enter a valid amount.";

// Ensures the amount is a non-empty, positive number-like string (e.g. "12.50").
function validateAmount(amount: string): string {
    const trimmed = amount.trim();
    if (!trimmed) throw new Error(AMOUNT_ERROR);
    const num = Number(trimmed);
    if (isNaN(num) || num <= 0) throw new Error(AMOUNT_ERROR);
    return trimmed;
}

// Main expenses data hook: fetch list + expose add/update/delete helpers.
export function useExpenses(initialFilters?: ExpenseFilters) {
    // Data state: list of expenses from the API.
    const [expenses, setExpenses] = useState<Expense[]>([]);
    // Request state: loading + error for the list fetch.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Initial load on mount (optionally with filters).
    useEffect(() => {
        fetchExpenses(initialFilters);
    }, []);

    // Fetch expenses from the backend and store them in local state.
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

    // Create a new expense (validates inputs, normalizes payload, then prepends to state).
    async function addExpense(payload: ExpensePayload) {
        const amount = validateAmount(payload.amount);
        const date = payload.date.trim();
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

    // Update an existing expense by id (validates inputs, normalizes payload, then replaces in state).
    async function updateExpense(id: number, payload: Partial<ExpensePayload>) {
        const amount = validateAmount(payload.amount ?? "");
        try {
            const date = payload.date?.trim();
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
            if (date) {
                updateBody.date = date;
            }

            const expense = await expensesApi.updateExpense(id, updateBody);
            setExpenses((prev) => prev.map((e) => (e.id === id ? expense : e)));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to update expense."));
        }
    }

    // Delete an expense by id (backend delete, then remove from local state).
    async function removeExpense(id: number) {
        try {
            await expensesApi.deleteExpense(id);
            setExpenses((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to delete expense."));
        }
    }

    // Public API for pages/components: list + loading/error + CRUD helpers.
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
