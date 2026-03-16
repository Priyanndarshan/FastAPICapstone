import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { MONTH_NAMES } from "../../../config/constants";
import { formatAmount } from "../../../utils/formatters";
import type { TrendPoint } from "../../../types";

interface SpendingTrendChartProps {
    trend: TrendPoint[];
    loading?: boolean;
}

function buildChartData(trend: TrendPoint[]) {
    return trend.map((p) => ({
        month: MONTH_NAMES[p.month - 1],
        monthShort: MONTH_NAMES[p.month - 1].slice(0, 3),
        spent: Number(p.total_spent),
        year: p.year,
    }));
}

export default function SpendingTrendChart({ trend, loading }: SpendingTrendChartProps) {
    const chartData = useMemo(() => buildChartData(trend), [trend]);

    if (loading) {
        return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">Spending trend</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Last 6 months</p>
                </div>
                <div className="flex h-[320px] items-center justify-center px-5 py-4">
                    <div className="space-y-3 text-center">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex justify-center gap-4">
                                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                                <div className="h-4 w-14 animate-pulse rounded bg-slate-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">Spending trend</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Last 6 months</p>
                </div>
                <div className="flex h-[200px] items-center justify-center px-5 py-4">
                    <p className="text-sm text-slate-500">No spending data yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Bar chart – Spending trend</h2>
                <p className="mt-0.5 text-xs text-slate-500">Total spent per month (last 6 months)</p>
            </div>
            <div className="px-4 py-4 sm:px-5">
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <YAxis
                            dataKey="monthShort"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            width={36}
                        />
                        <XAxis type="number" hide />
                        <Tooltip
                            cursor={false}
                            formatter={(value: unknown) => [formatAmount(Number(value ?? 0)), "Spent"]}
                            labelFormatter={(_, payload) => payload?.[0]?.payload ? `${(payload[0].payload as { month: string; year: number }).month} ${(payload[0].payload as { month: string; year: number }).year}` : ""}
                            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                        <Bar
                            dataKey="spent"
                            fill="rgb(72 99 212)"
                            radius={4}
                            maxBarSize={28}
                        >
                            <LabelList
                                dataKey="monthShort"
                                position="insideLeft"
                                offset={8}
                                fill="#fff"
                                fontSize={11}
                                fontWeight={500}
                            />
                            <LabelList
                                dataKey="spent"
                                position="right"
                                offset={8}
                                formatter={(value: unknown) => formatAmount(Number(value))}
                                fill="#334155"
                                fontSize={12}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none text-slate-700">
                    <TrendingUp className="h-4 w-4 text-slate-500" aria-hidden />
                    Spending trend – last 6 months
                </div>
                <p className="leading-none text-slate-500">
                    Showing total spent per month.
                </p>
            </div>
        </div>
    );
}
