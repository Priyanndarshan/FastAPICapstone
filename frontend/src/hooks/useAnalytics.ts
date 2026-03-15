import { useEffect, useCallback } from "react";
import * as analyticsApi from "../api/analytics";
import type { MonthlyAnalytics, TopCategory, TrendPoint } from "../types";
import { parseApiError } from "../utils/parseApiError";
import { useAsyncState } from "./useAsyncState";

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
    const { data, loading, error, run } = useAsyncState<AnalyticsData>(initialData);

    const fetchAll = useCallback(async () => {
        await run(async () => {
            const [monthly, topCategory, trendRes] = await Promise.all([
                analyticsApi.getMonthlyAnalytics(month, year),
                analyticsApi.getTopCategory(month, year),
                analyticsApi.getTrend(trendMonths),
            ]);
            return {
                monthly,
                topCategory,
                trend: trendRes.points ?? [],
            };
        });
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
