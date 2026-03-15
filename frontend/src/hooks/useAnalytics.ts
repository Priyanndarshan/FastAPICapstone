import { useState, useEffect, useCallback } from "react";
import * as analyticsApi from "../api/analytics";
import type { MonthlyAnalytics, TopCategory, TrendPoint } from "../types";
import { parseApiError } from "../utils/parseApiError";

const now = new Date();
const defaultMonth = now.getMonth() + 1;
const defaultYear = now.getFullYear();

export function useAnalytics(month = defaultMonth, year = defaultYear, trendMonths = 6) {
    const [monthly, setMonthly] = useState<MonthlyAnalytics | null>(null);
    const [topCategory, setTopCategory] = useState<TopCategory | null>(null);
    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [monthlyRes, topRes, trendRes] = await Promise.all([
                analyticsApi.getMonthlyAnalytics(month, year),
                analyticsApi.getTopCategory(month, year),
                analyticsApi.getTrend(trendMonths),
            ]);
            setMonthly(monthlyRes);
            setTopCategory(topRes);
            setTrend(trendRes.points ?? []);
        } catch (err) {
            setError(parseApiError(err, "Failed to load analytics."));
        } finally {
            setLoading(false);
        }
    }, [month, year, trendMonths]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return {
        monthly,
        topCategory,
        trend,
        loading,
        error,
        refetch: fetchAll,
    };
}
