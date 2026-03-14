// src/types/index.ts

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Category {
    id: number;
    name: string;
}

export interface Expense {
    id: number;
    category_id: number | null;
    amount: string;        // Decimal comes back as string from FastAPI
    currency: string;
    date: string;          // ISO date string e.g. "2024-01-25"
    notes: string | null;
    is_recurring: boolean;
    recurrence_period: string | null;
}