// Page deps: AuthContext, routing, config, shared components + icons, data hooks, formatters
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MONTH_NAMES } from "../config/constants";
import { PageHeader, SpendingTrendChart, CategorySpendingPieChart, OverBudgetBanner, RecentExpenses } from "../components/shared";
import { useAnalytics } from "../hooks/analytics/useAnalytics";
import { useExpenses } from "../hooks/expenses/useExpenses";
import { useCategories } from "../hooks/categories/useCategories";
import { useBudgets } from "../hooks/budgets/useBudgets";
import { useBudgetByCategory } from "../hooks/categories/useBudgetByCategory";
import { useOverBudgetCategories } from "../hooks/categories/useOverBudgetCategories";
import { countExpensesInMonth, formatAmount } from "../utils/formatters";

export default function Dashboard() {
    // Current user and local UI state: whether the over-budget warning banner has been dismissed
    const { user } = useAuth();
    const [budgetWarningDismissed, setBudgetWarningDismissed] = useState(false);
    // Current month/year for analytics and labels; pie chart has its own month/year state
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Analytics (6 months trend + monthly breakdown), expenses list, categories, budgets; second useAnalytics for pie chart month/year
    const { monthly, trend, topCategory, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics(currentMonth, currentYear, 6);
    const [pieChartMonth, setPieChartMonth] = useState(currentMonth);
    const [pieChartYear, setPieChartYear] = useState(currentYear);
    const { monthly: pieChartMonthly, loading: pieChartLoading } = useAnalytics(pieChartMonth, pieChartYear, 1);
    const { expenses, loading: expensesLoading } = useExpenses();
    const { categories } = useCategories();
    const { budgets } = useBudgets();

    // Map categoryId → { limit, spent } for current month; merges budgets with monthly analytics spending
    const budgetByCategory = useBudgetByCategory(currentMonth, currentYear, budgets, monthly);

    // List of categories where spent > limit this month; used for the red warning banner
    const overBudgetCategories = useOverBudgetCategories(budgetByCategory, categories);

    // Header description and badge: "X transactions this month", "Y categories"
    const periodLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;
    const thisMonthCount = countExpensesInMonth(expenses, currentMonth, currentYear);

    // Layout: header with welcome + badges, over-budget warning (dismissible), analytics error, then two-column grid + trend chart
    return (
        <div className="space-y-8">
            {/* Title, period label, transaction count and category count badges */}
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
                        {!analyticsLoading && topCategory && (
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
                                Top: {topCategory.category_name ?? "Uncategorized"} – {formatAmount(Number(topCategory.total_amount))}
                            </span>
                        )}
                    </>
                }
            />

            {/* Dismissible banner when any category is over budget */}
            {overBudgetCategories.length > 0 && !budgetWarningDismissed && (
                <OverBudgetBanner
                    categories={overBudgetCategories}
                    onDismiss={() => setBudgetWarningDismissed(true)}
                />
            )}

            {/* Shown when useAnalytics returns an error; "Try again" calls refetchAnalytics */}
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

            {/* Two columns: recent expenses card (left) and category pie chart (right) */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <RecentExpenses
                    expenses={expenses.slice(0, 5)}
                    categories={categories}
                    loading={expensesLoading}
                />

                {/* Pie chart for selected month/year; month/year controlled by dropdown in component */}
                <CategorySpendingPieChart
                    monthly={pieChartMonthly}
                    loading={pieChartLoading}
                    selectedMonth={pieChartMonth}
                    selectedYear={pieChartYear}
                    onMonthChange={(m, y) => { setPieChartMonth(m); setPieChartYear(y); }}
                />
            </div>

            {/* Line chart: 6-month spending trend from useAnalytics trend data */}
            <SpendingTrendChart trend={trend} loading={analyticsLoading} />
        </div>
    );
}
