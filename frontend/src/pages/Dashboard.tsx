import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import CashFlowSummaryCard from "../components/shared/CashFlowSummaryCard";
import { useAnalytics } from "../hooks/useAnalytics";
import { useExpenses } from "../hooks/useExpenses";
import { useCategories } from "../hooks/useCategories";

const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleString("default", { month: "short" })
);

export default function Dashboard() {
    const { user } = useAuth();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { monthly, topCategory, trend, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics(currentMonth, currentYear, 6);
    const { expenses, loading: expensesLoading } = useExpenses();
    const { categories } = useCategories();

    const recentExpenses = expenses.slice(0, 5);
    const getCategoryName = (id: number | null) =>
        id ? categories.find((c) => c.id === id)?.name ?? "—" : "—";

    const periodLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;

    const thisMonthExpenses = expenses.filter((e) => {
        const [y, m] = e.date.split("-").map(Number);
        return y === currentYear && m === currentMonth;
    });
    const cashIn = thisMonthExpenses.filter((e) => e.transaction_type === "in").reduce((s, e) => s + Number(e.amount), 0);
    const cashOut = thisMonthExpenses.filter((e) => e.transaction_type === "out").reduce((s, e) => s + Number(e.amount), 0);

    return (
        <div className="space-y-8">
            {/* Page header */}
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Overview for {periodLabel}
                    {user?.name && <span className="ml-2 text-slate-400">· {user.name}</span>}
                </p>
            </header>

            {/* Cash In / Cash Out / Net Balance summary */}
            <CashFlowSummaryCard
                cashIn={cashIn}
                cashOut={cashOut}
                loading={expensesLoading}
            />

            {/* KPI cards — two metrics only */}
            <section className="grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Total spent this month
                        </p>
                    </div>
                    <div className="px-5 py-5">
                        {analyticsLoading ? (
                            <div className="h-9 w-24 animate-pulse rounded bg-slate-200" />
                        ) : (
                            <p className="text-2xl font-bold tabular-nums text-slate-900">
                                {monthly
                                    ? Number(monthly.total_spent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : "0.00"}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">{periodLabel}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Top spending category
                        </p>
                    </div>
                    <div className="px-5 py-5">
                        {analyticsLoading ? (
                            <div className="h-9 w-32 animate-pulse rounded bg-slate-200" />
                        ) : topCategory ? (
                            <>
                                <p className="text-lg font-semibold text-slate-900">
                                    {topCategory.category_name ?? "Uncategorized"}
                                </p>
                                <p className="mt-1 tabular-nums text-slate-600">
                                    {Number(topCategory.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </>
                        ) : (
                            <p className="text-slate-500">No expenses this month yet</p>
                        )}
                    </div>
                </div>
            </section>

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

            {/* Main content: recent activity + trend */}
            <div className="grid gap-8 lg:grid-cols-2">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Recent expenses</h2>
                            <Link
                                to="/expenses"
                                className="text-sm font-medium text-violet-600 hover:text-violet-700"
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
                                No expenses yet. Add one from the Expenses page.
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
                                        <span className={`ml-4 shrink-0 tabular-nums text-sm font-medium ${exp.transaction_type === "in" ? "text-emerald-600" : "text-red-600"}`}>
                                            {exp.transaction_type === "in" ? "+" : ""}{exp.amount} <span className="text-slate-400">({exp.payment_mode})</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-900">Spending trend</h2>
                        <p className="mt-0.5 text-xs text-slate-500">Last 6 months</p>
                    </div>
                    <div className="px-5 py-4">
                        {analyticsLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                                        <div className="h-4 w-14 animate-pulse rounded bg-slate-100" />
                                    </div>
                                ))}
                            </div>
                        ) : trend.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">
                                No spending data yet.
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {trend.map((p) => (
                                    <li key={`${p.year}-${p.month}`} className="flex items-center justify-between py-3 first:pt-0">
                                        <span className="text-sm text-slate-600">
                                            {MONTH_NAMES[p.month - 1]} {p.year}
                                        </span>
                                        <span className="tabular-nums font-medium text-slate-900">
                                            {Number(p.total_spent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
