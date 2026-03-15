
export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
}

export interface Category {
    id: number;
    name: string;
}

export interface Expense {
    id: number;
    category_id: number | null;
    amount: string;        // Decimal comes back as string from FastAPI
    payment_mode: string;  // e.g. UPI, CASH
    transaction_type: "in" | "out";  // Cash In vs Cash Out
    date: string;          // ISO date string e.g. "2024-01-25"
    notes: string | null;
    is_recurring: boolean;
    recurrence_period: string | null;
}

export interface Budget {
    id: number;
    category_id: number;
    month: number;   // 1–12
    year: number;
    limit_amount: string;  // Decimal from API
}

export interface MonthlyCategoryBreakdown {
    category_id: number | null;
    category_name: string | null;
    total_amount: string;
}

export interface MonthlyAnalytics {
    month: number;
    year: number;
    total_spent: string;
    categories: MonthlyCategoryBreakdown[];
}

export interface TopCategory {
    month: number;
    year: number;
    category_id: number | null;
    category_name: string | null;
    total_amount: string;
}

export interface TrendPoint {
    month: number;
    year: number;
    total_spent: string;
}