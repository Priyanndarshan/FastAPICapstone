// src/api/expenses.ts
import client from "./client";
import type { Expense } from "../types";

export interface ExpenseFilters {
    start_date?: string;
    end_date?: string;
    category_id?: number;
    keyword?: string;
    transaction_type?: "in" | "out";
    payment_modes?: string;
}

export interface ExpensePayload {
    category_id?: number | null;
    amount: string;
    payment_mode?: string;
    transaction_type?: "in" | "out";
    date: string;
    notes?: string | null;
    is_recurring: boolean;
    recurrence_period?: string | null;
}

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