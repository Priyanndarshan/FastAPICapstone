import { useEffect, useCallback, useState } from "react";
import * as analyticsApi from "../api/analytics";
import type { MonthlyAnalytics, TopCategory, TrendPoint } from "../types";
import { parseApiError } from "../utils/parseApiError";

interface AnalyticsData {
    monthly: MonthlyAnalytics | null;
    topCategory: TopCategory | null;
    trend: TrendPoint[];
}

const initialData: AnalyticsData = {
    monthly: null,
    topCategory: null,
    trend: [],
};

const now = new Date();
const defaultMonth = now.getMonth() + 1;
const defaultYear = now.getFullYear();

export function useAnalytics(
    month = defaultMonth,
    year = defaultYear,
    trendMonths = 6
) {
    const [data, setData] = useState<AnalyticsData>(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [monthly, topCategory, trendRes] = await Promise.all([
                analyticsApi.getMonthlyAnalytics(month, year),
                analyticsApi.getTopCategory(month, year),
                analyticsApi.getTrend(trendMonths),
            ]);
            setData({
                monthly,
                topCategory,
                trend: trendRes.points ?? [],
            });
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
        monthly: data.monthly,
        topCategory: data.topCategory,
        trend: data.trend,
        loading,
        error,
        refetch: fetchAll,
    };
}
