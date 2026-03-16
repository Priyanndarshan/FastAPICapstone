import { useEffect } from "react";
import * as expensesApi from "../api/expenses";
import type { ExpenseFilters, ExpensePayload } from "../api/expenses";
import type { Expense } from "../types";
import { parseApiError } from "../utils/parseApiError";
import { useAsyncState } from "./useAsyncState";

const AMOUNT_ERROR = "Enter a valid amount.";

function validateAmount(amount: string): string {
    const trimmed = amount.trim();
    if (!trimmed) throw new Error(AMOUNT_ERROR);
    const num = Number(trimmed);
    if (isNaN(num) || num <= 0) throw new Error(AMOUNT_ERROR);
    return trimmed;
}

export function useExpenses(initialFilters?: ExpenseFilters) {
    const { data: expenses, loading, error, run, setData } = useAsyncState<Expense[]>([]);

    useEffect(() => {
        fetchExpenses(initialFilters);
    }, []);

    async function fetchExpenses(filters?: ExpenseFilters) {
        await run(() => expensesApi.getExpenses(filters));
    }

    async function addExpense(payload: ExpensePayload) {
        const amount = validateAmount(payload.amount);
        try {
            const expense = await expensesApi.createExpense({
                ...payload,
                amount,
                category_id: payload.category_id ?? null,
                payment_mode: payload.payment_mode ?? "CASH",
                transaction_type: payload.transaction_type ?? "out",
                notes: payload.notes || null,
                recurrence_period: payload.is_recurring ? payload.recurrence_period ?? null : null,
            });
            setData((prev) => [expense, ...prev]);
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add expense."));
        }
    }

    async function updateExpense(id: number, payload: Partial<ExpensePayload>) {
        const amount = validateAmount(payload.amount ?? "");
        try {
            const expense = await expensesApi.updateExpense(id, {
                ...payload,
                amount,
                category_id: payload.category_id ?? null,
                payment_mode: payload.payment_mode ?? "CASH",
                transaction_type: payload.transaction_type ?? "out",
                notes: payload.notes || null,
                recurrence_period: payload.is_recurring ? payload.recurrence_period ?? null : null,
            });
            setData((prev) => prev.map((e) => (e.id === id ? expense : e)));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to update expense."));
        }
    }

    async function removeExpense(id: number) {
        try {
            await expensesApi.deleteExpense(id);
            setData((prev) => prev.filter((e) => e.id !== id));
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
