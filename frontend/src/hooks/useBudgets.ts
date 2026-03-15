import { useEffect } from "react";
import * as budgetsApi from "../api/budgets";
import type { BudgetCreatePayload, BudgetUpdatePayload } from "../api/budgets";
import type { Budget } from "../types";
import { parseApiError } from "../utils/parseApiError";
import { useAsyncState } from "./useAsyncState";

export function useBudgets() {
    const { data: budgets, loading, error, run, setData } = useAsyncState<Budget[]>([]);

    useEffect(() => {
        fetchBudgets();
    }, []);

    async function fetchBudgets() {
        await run(() => budgetsApi.getBudgets());
    }

    async function addBudget(payload: BudgetCreatePayload) {
        try {
            const budget = await budgetsApi.createBudget(payload);
            setData((prev) => [...prev, budget]);
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add budget."));
        }
    }

    async function updateBudget(id: number, payload: BudgetUpdatePayload) {
        try {
            const budget = await budgetsApi.updateBudget(id, payload);
            setData((prev) => prev.map((b) => (b.id === id ? budget : b)));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to update budget."));
        }
    }

    async function removeBudget(id: number) {
        try {
            await budgetsApi.deleteBudget(id);
            setData((prev) => prev.filter((b) => b.id !== id));
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
