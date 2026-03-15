import client from "./client";
import type { MonthlyAnalytics, TopCategory, TrendResponse } from "../types";

export async function getMonthlyAnalytics(month: number, year: number): Promise<MonthlyAnalytics> {
    const res = await client.get("/analytics/monthly", { params: { month, year } });
    const data = res.data;
    return {
        ...data,
        total_spent: String(data.total_spent ?? 0),
        categories: (data.categories ?? []).map((c: { total_amount?: unknown }) => ({
            ...c,
            total_amount: String(c.total_amount ?? 0),
        })),
    };
}

export async function getTopCategory(month: number, year: number): Promise<TopCategory | null> {
    try {
        const res = await client.get("/analytics/top-category", { params: { month, year } });
        const data = res.data;
        return {
            ...data,
            total_amount: String(data.total_amount ?? 0),
        };
    } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        if (e?.response?.status === 404) return null;
        throw err;
    }
}

export async function getTrend(months = 6): Promise<TrendResponse> {
    const res = await client.get("/analytics/trend", { params: { months } });
    const data = res.data;
    return {
        points: (data.points ?? []).map((p: { total_spent?: unknown }) => ({
            ...p,
            total_spent: String(p.total_spent ?? 0),
        })),
    };
}
