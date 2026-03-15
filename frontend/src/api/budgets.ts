import client from "./client";
import type { Budget, BudgetCreatePayload, BudgetUpdatePayload } from "../types";

export async function getBudgets(): Promise<Budget[]> {
    const res = await client.get("/budgets");
    return res.data;
}

export async function getBudget(id: number): Promise<Budget> {
    const res = await client.get(`/budgets/${id}`);
    return res.data;
}

export async function createBudget(payload: BudgetCreatePayload): Promise<Budget> {
    const res = await client.post("/budgets", payload);
    return res.data;
}

export async function updateBudget(id: number, payload: BudgetUpdatePayload): Promise<Budget> {
    const res = await client.put(`/budgets/${id}`, payload);
    return res.data;
}

export async function deleteBudget(id: number): Promise<void> {
    await client.delete(`/budgets/${id}`);
}
