// src/api/expenses.ts
import client from "./client";
import type { Expense, ExpenseFilters, ExpensePayload } from "../types";

export async function getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    const res = await client.get("/expenses", { params: filters });
    return res.data;
}

export async function getExpense(id: number): Promise<Expense> {
    const res = await client.get(`/expenses/${id}`);
    return res.data;
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
    const res = await client.post("/expenses", payload);
    return res.data;
}

export async function updateExpense(id: number, payload: Partial<ExpensePayload>): Promise<Expense> {
    const res = await client.put(`/expenses/${id}`, payload);
    return res.data;
}

export async function deleteExpense(id: number): Promise<void> {
    await client.delete(`/expenses/${id}`);
}