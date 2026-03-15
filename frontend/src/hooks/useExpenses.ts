import { useState, useEffect } from "react";
import * as expensesApi from "../api/expenses";
import type { ExpenseFilters, ExpensePayload } from "../api/expenses";
import type { Expense } from "../types";
import { parseApiError } from "../utils/parseApiError";

export function useExpenses(initialFilters?: ExpenseFilters) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function fetchExpenses(filters?: ExpenseFilters) {
        setLoading(true);
        setError("");
        try {
            setExpenses(await expensesApi.getExpenses(filters));
        } catch (err) {
            setError(parseApiError(err, "Failed to load expenses."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchExpenses(initialFilters);
    }, []);

    async function addExpense(payload: ExpensePayload) {
        try {
            const expense = await expensesApi.createExpense(payload);
            setExpenses((prev) => [...prev, expense]);
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add expense."));
        }
    }

    async function updateExpense(id: number, payload: Partial<ExpensePayload>) {
        try {
            const expense = await expensesApi.updateExpense(id, payload);
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
