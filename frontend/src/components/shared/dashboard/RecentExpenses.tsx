import { Link } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import type { Category, Expense } from "../../../types";
import { formatAmount } from "../../../utils/formatters";

interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
  loading?: boolean;
}

export default function RecentExpenses({ expenses, categories, loading }: RecentExpensesProps) {
  const getCategoryName = (id: number | null) =>
    id ? categories.find((c) => c.id === id)?.name ?? "—" : "—";

  return (
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
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No expenses yet.{" "}
            <Link to={ROUTES.EXPENSES} className="font-medium text-[#4863D4] hover:underline">
              Add one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {expenses.map((exp) => (
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
                <span
                  className={`ml-4 shrink-0 tabular-nums text-sm font-medium ${
                    exp.transaction_type === "in" ? "text-[#4863D4]" : "text-red-600"
                  }`}
                >
                  {exp.transaction_type === "in" ? "+" : ""}
                  {formatAmount(Number(exp.amount))}{" "}
                  <span className="text-slate-400">({exp.payment_mode})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

