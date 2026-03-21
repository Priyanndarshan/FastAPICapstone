import api from "./client";
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
    receipt_url?: string | null;
}

export async function getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    const res = await api.get("/expenses", { params: filters });
    return res.data;
}

export interface PaginatedExpensesResponse {
    items: Expense[];
    total: number;
    page: number;
    page_size: number;
    cash_in_total: string;
    cash_out_total: string;
}

export interface PagedExpenseQuery extends ExpenseFilters {
    page: number;
    page_size: number;
    sort_by: "date" | "amount_desc" | "amount_asc";
}

export async function getExpensesPaged(query: PagedExpenseQuery): Promise<PaginatedExpensesResponse> {
    const res = await api.get("/expenses/paged", { params: query });
    return res.data;
}

export async function getExpense(id: number): Promise<Expense> {
    const res = await api.get(`/expenses/${id}`);
    return res.data;
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
    const res = await api.post("/expenses", payload);
    return res.data;
}

export async function updateExpense(id: number, payload: Partial<ExpensePayload>): Promise<Expense> {
    const res = await api.put(`/expenses/${id}`, payload);
    return res.data;
}

export async function deleteExpense(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`);
}


export async function uploadReceipt(file: File): Promise<{ receipt_url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ receipt_url: string }>("/expenses/upload-receipt", formData);
    return res.data;
}