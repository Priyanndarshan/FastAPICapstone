import { useMemo } from "react";
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatAmount } from "../../utils/formatters";
import { MONTH_NAMES } from "../../config/constants";
import type { MonthlyAnalytics } from "../../types";

const CHART_COLORS = [
    "rgb(72 99 212)",   // #4863D4
    "rgb(100 116 139)",  // slate-500
    "rgb(72 99 212)",   // #4863D4 (lighter variant in palette)
    "rgb(245 158 11)",   // amber-500
    "rgb(236 72 153)",   // pink-500
    "rgb(59 130 246)",   // blue-500
];

function getMonthOptions() {
    const now = new Date();
    const options: { month: number; year: number; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        options.push({
            month: d.getMonth() + 1,
            year: d.getFullYear(),
            label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        });
    }
    return options;
}

const MONTH_OPTIONS = getMonthOptions();

interface CategorySpendingPieChartProps {
    monthly: MonthlyAnalytics | null;
    loading?: boolean;
    selectedMonth?: number;
    selectedYear?: number;
    onMonthChange?: (month: number, year: number) => void;
}

export default function CategorySpendingPieChart({ monthly, loading, selectedMonth, selectedYear, onMonthChange }: CategorySpendingPieChartProps) {
    const chartData = useMemo(() => {
        if (!monthly?.categories?.length) return [];
        return monthly.categories
            .filter((c) => Number(c.total_amount) > 0)
            .map((c, i) => ({
                name: c.category_name ?? "Uncategorized",
                value: Number(c.total_amount),
                fill: CHART_COLORS[i % CHART_COLORS.length],
            }));
    }, [monthly]);

    const headerContent = (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
                <h2 className="text-base font-semibold text-slate-900">Spending by category</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                    How much you spent per category {selectedMonth && selectedYear ? `in ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}` : "this month"}
                </p>
            </div>
            {onMonthChange && selectedMonth != null && selectedYear != null && (
                <select
                    value={MONTH_OPTIONS.find((o) => o.month === selectedMonth && o.year === selectedYear)?.label ?? MONTH_OPTIONS[0].label}
                    onChange={(e) => {
                        const opt = MONTH_OPTIONS.find((o) => o.label === e.target.value);
                        if (opt) onMonthChange(opt.month, opt.year);
                    }}
                    aria-label="Filter by month"
                    className="shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-[#4863D4] focus:outline-none focus:ring-1 focus:ring-[#4863D4]/20"
                >
                    {MONTH_OPTIONS.map((o) => (
                        <option key={`${o.year}-${o.month}`} value={o.label}>{o.label}</option>
                    ))}
                </select>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    {headerContent}
                </div>
                <div className="flex aspect-square max-h-[280px] items-center justify-center p-6">
                    <div className="h-40 w-40 animate-pulse rounded-full bg-slate-100" />
                </div>
            </div>
        );
    }

    if (!chartData.length) {
        return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    {headerContent}
                </div>
                <div className="flex aspect-square max-h-[280px] items-center justify-center p-6">
                    <p className="text-center text-sm text-slate-500">No spending by category yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
                {headerContent}
            </div>
            <div className="p-4">
                <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                        <Tooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const item = payload[0];
                                return (
                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        <p className="mt-0.5 tabular-nums text-slate-600">
                                            Spent: {formatAmount(Number(item.value))}
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            formatter={(value) => <span className="text-sm text-slate-700">{value}</span>}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
