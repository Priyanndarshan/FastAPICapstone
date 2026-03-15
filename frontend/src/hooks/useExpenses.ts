import { useEffect } from "react";
import * as expensesApi from "../api/expenses";
import type { ExpenseFilters, ExpensePayload } from "../api/expenses";
import type { Expense } from "../types";
import { parseApiError } from "../utils/parseApiError";
import { useAsyncState } from "./useAsyncState";

export function useExpenses(initialFilters?: ExpenseFilters) {
    const { data: expenses, loading, error, run, setData } = useAsyncState<Expense[]>([]);

    useEffect(() => {
        fetchExpenses(initialFilters);
    }, []);

    async function fetchExpenses(filters?: ExpenseFilters) {
        await run(() => expensesApi.getExpenses(filters));
    }

    async function addExpense(payload: ExpensePayload) {
        try {
            const expense = await expensesApi.createExpense(payload);
            setData((prev) => [expense, ...prev]);
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add expense."));
        }
    }

    async function updateExpense(id: number, payload: Partial<ExpensePayload>) {
        try {
            const expense = await expensesApi.updateExpense(id, payload);
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
