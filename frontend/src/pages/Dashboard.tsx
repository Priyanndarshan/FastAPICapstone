import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { ROUTES, MONTH_NAMES } from "../config/constants";
import { PageHeader, SpendingTrendChart, CategorySpendingPieChart } from "../components/shared";
import { useAnalytics } from "../hooks/useAnalytics";
import { useExpenses } from "../hooks/useExpenses";
import { useCategories } from "../hooks/useCategories";
import { useBudgets } from "../hooks/useBudgets";
import { formatAmount } from "../utils/formatters";

export default function Dashboard() {
    const { user } = useAuth();
    const [budgetWarningDismissed, setBudgetWarningDismissed] = useState(false);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { monthly, trend, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics(currentMonth, currentYear, 6);
    const [pieChartMonth, setPieChartMonth] = useState(currentMonth);
    const [pieChartYear, setPieChartYear] = useState(currentYear);
    const { monthly: pieChartMonthly, loading: pieChartLoading } = useAnalytics(pieChartMonth, pieChartYear, 1);
    const { expenses, loading: expensesLoading } = useExpenses();
    const { categories } = useCategories();
    const { budgets } = useBudgets();

    const recentExpenses = expenses.slice(0, 5);
    const getCategoryName = (id: number | null) =>
        id ? categories.find((c) => c.id === id)?.name ?? "—" : "—";

    const budgetByCategory = useMemo(() => {
        const map: Record<number, { limit: number; spent: number }> = {};
        const thisMonthBudgets = budgets.filter(
            (b) => b.month === currentMonth && b.year === currentYear
        );
        for (const b of thisMonthBudgets) {
            map[b.category_id] = { limit: Number(b.limit_amount), spent: 0 };
        }
        for (const c of monthly?.categories ?? []) {
            if (c.category_id != null) {
                const spent = Number(c.total_amount);
                if (map[c.category_id]) {
                    map[c.category_id].spent = spent;
                } else {
                    map[c.category_id] = { limit: 0, spent };
                }
            }
        }
        return map;
    }, [budgets, monthly, currentMonth, currentYear]);

    const overBudgetCategories = useMemo(() => {
        const list: { categoryId: number; name: string; limit: number; spent: number; overAmount: number }[] = [];
        for (const [categoryId, data] of Object.entries(budgetByCategory)) {
            if (data.limit > 0 && data.spent > data.limit) {
                const catId = Number(categoryId);
                const name = categories.find((c) => c.id === catId)?.name ?? "—";
                list.push({
                    categoryId: catId,
                    name,
                    limit: data.limit,
                    spent: data.spent,
                    overAmount: data.spent - data.limit,
                });
            }
        }
        return list;
    }, [budgetByCategory, categories]);

    const periodLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;
    const thisMonthCount = expenses.filter((e) => {
        const [y, m] = e.date.split("-").map(Number);
        return y === currentYear && m === currentMonth;
    }).length;

    return (
        <div className="space-y-8">
            <PageHeader
                title={user ? `Welcome, ${user.name?.trim() || user.email || "User"}` : "Dashboard"}
                description={periodLabel}
                badge={
                    <>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {thisMonthCount} transaction{thisMonthCount !== 1 ? "s" : ""} this month
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
                        </span>
                    </>
                }
            />

            {overBudgetCategories.length > 0 && !budgetWarningDismissed && (
                <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
                    <p className="flex-1 min-w-0 text-sm font-medium text-red-800">
                        Budget exceeded: {overBudgetCategories.map((c) => c.name).join(", ")}.
                        <Link to={ROUTES.CATEGORIES} className="ml-1 font-medium text-red-700 hover:text-red-900 underline">
                            Adjust →
                        </Link>
                    </p>
                    <button
                        type="button"
                        onClick={() => setBudgetWarningDismissed(true)}
                        className="shrink-0 rounded p-1.5 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label="Dismiss warning"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {analyticsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                    <p className="text-sm text-red-700">{analyticsError}</p>
                    <button
                        type="button"
                        onClick={refetchAnalytics}
                        className="mt-2 text-sm font-medium text-red-600 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Recent expenses</h2>
                            <Link
                                to={ROUTES.EXPENSES}
                                className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                            >
                                View all →
                            </Link>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">Latest transactions</p>
                    </div>
                    <div className="px-5 py-4">
                        {expensesLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                                        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                                    </div>
                                ))}
                            </div>
                        ) : recentExpenses.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">
                                No expenses yet. <Link to={ROUTES.EXPENSES} className="font-medium text-[#4863D4] hover:underline">Add one</Link>.
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {recentExpenses.map((exp) => (
                                    <li key={exp.id} className="flex items-center justify-between py-3 first:pt-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-slate-800 truncate">
                                                {getCategoryName(exp.category_id)}
                                            </p>
                                            {exp.notes && (
                                                <p className="truncate text-xs text-slate-500" title={exp.notes}>
                                                    {exp.notes}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`ml-4 shrink-0 tabular-nums text-sm font-medium ${exp.transaction_type === "in" ? "text-[#4863D4]" : "text-red-600"}`}>
                                            {exp.transaction_type === "in" ? "+" : ""}{formatAmount(Number(exp.amount))} <span className="text-slate-400">({exp.payment_mode})</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <CategorySpendingPieChart
                    monthly={pieChartMonthly}
                    loading={pieChartLoading}
                    selectedMonth={pieChartMonth}
                    selectedYear={pieChartYear}
                    onMonthChange={(m, y) => { setPieChartMonth(m); setPieChartYear(y); }}
                />
            </div>

            <SpendingTrendChart trend={trend} loading={analyticsLoading} />
        </div>
    );
}
