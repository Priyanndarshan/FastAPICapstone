import api from "./client";
import type { Budget } from "../types";

export interface BudgetCreatePayload {
    category_id: number;
    month: number;
    year: number;
    limit_amount: string;
}

export interface BudgetUpdatePayload {
    month?: number;
    year?: number;
    limit_amount?: string;
}

export async function getBudgets(): Promise<Budget[]> {
    const res = await api.get("/budgets");
    return res.data;
}

export async function getBudget(id: number): Promise<Budget> {
    const res = await api.get(`/budgets/${id}`);
    return res.data;
}

export async function createBudget(payload: BudgetCreatePayload): Promise<Budget> {
    const res = await api.post("/budgets", payload);
    return res.data;
}

export async function updateBudget(id: number, payload: BudgetUpdatePayload): Promise<Budget> {
    const res = await api.put(`/budgets/${id}`, payload);
    return res.data;
}

export async function deleteBudget(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`);
}
