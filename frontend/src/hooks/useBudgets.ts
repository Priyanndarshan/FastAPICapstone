import { useState, useEffect } from "react";
import * as budgetsApi from "../api/budgets";
import type { BudgetCreatePayload, BudgetUpdatePayload } from "../api/budgets";
import type { Budget } from "../types";
import { parseApiError } from "../utils/parseApiError";

export function useBudgets() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function fetchBudgets() {
        setLoading(true);
        setError("");
        try {
            setBudgets(await budgetsApi.getBudgets());
        } catch (err) {
            setError(parseApiError(err, "Failed to load budgets."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBudgets();
    }, []);

    async function addBudget(payload: BudgetCreatePayload) {
        try {
            const budget = await budgetsApi.createBudget(payload);
            setBudgets((prev) => [...prev, budget]);
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add budget."));
        }
    }

    async function updateBudget(id: number, payload: BudgetUpdatePayload) {
        try {
            const budget = await budgetsApi.updateBudget(id, payload);
            setBudgets((prev) => prev.map((b) => (b.id === id ? budget : b)));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to update budget."));
        }
    }

    async function removeBudget(id: number) {
        try {
            await budgetsApi.deleteBudget(id);
            setBudgets((prev) => prev.filter((b) => b.id !== id));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to delete budget."));
        }
    }

    return {
        budgets,
        loading,
        error,
        refetch: fetchBudgets,
        addBudget,
        updateBudget,
        removeBudget,
    };
}
