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
    const { user } = useAuth();
    const [budgetWarningDismissed, setBudgetWarningDismissed] = useState(false);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { monthly, trend, topCategory, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics(currentMonth, currentYear, 6);
    const [pieChartMonth, setPieChartMonth] = useState(currentMonth);
    const [pieChartYear, setPieChartYear] = useState(currentYear);
    const { monthly: pieChartMonthly, loading: pieChartLoading } = useAnalytics(pieChartMonth, pieChartYear, 1);
    const { expenses, loading: expensesLoading } = useExpenses();
    const { categories } = useCategories();
    const { budgets } = useBudgets();

    const budgetByCategory = useBudgetByCategory(currentMonth, currentYear, budgets, monthly);

    const overBudgetCategories = useOverBudgetCategories(budgetByCategory, categories);

    const periodLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;
    const thisMonthCount = countExpensesInMonth(expenses, currentMonth, currentYear);

    return (
        <div className="space-y-8">
            {}
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

            {}
            {overBudgetCategories.length > 0 && !budgetWarningDismissed && (
                <OverBudgetBanner
                    categories={overBudgetCategories}
                    onDismiss={() => setBudgetWarningDismissed(true)}
                />
            )}

            {}
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

            {}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <RecentExpenses
                    expenses={expenses.slice(0, 5)}
                    categories={categories}
                    loading={expensesLoading}
                />

                {}
                <CategorySpendingPieChart
                    monthly={pieChartMonthly}
                    loading={pieChartLoading}
                    selectedMonth={pieChartMonth}
                    selectedYear={pieChartYear}
                    onMonthChange={(m, y) => { setPieChartMonth(m); setPieChartYear(y); }}
                />
            </div>

            {}
            <SpendingTrendChart trend={trend} loading={analyticsLoading} />
        </div>
    );
}
