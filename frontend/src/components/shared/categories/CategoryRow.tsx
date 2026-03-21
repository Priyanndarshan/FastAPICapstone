import type { Category } from "../../../types";
import { MONTH_NAMES } from "../../../config/constants";
import { formatAmount } from "../../../utils/formatters";
import { CategoryIcon, DeleteIcon } from "../../ui/icons";

export interface BudgetInfo {
    limit: number;
    spent: number;
}

export interface CategoryRowProps {
    cat: Category;
    budgetInfo?: BudgetInfo;
    month: number;
    year: number;
    onDeleteClick: () => void;
    onAddBudgetClick: () => void;
}

export function CategoryRow({
    cat,
    budgetInfo,
    month,
    year,
    onDeleteClick,
    onAddBudgetClick,
}: CategoryRowProps) {
    const hasBudget = budgetInfo && budgetInfo.limit > 0;
    const left = hasBudget ? budgetInfo!.limit - budgetInfo!.spent : 0;
    const overBudget = hasBudget && budgetInfo!.spent > budgetInfo!.limit;
    const pct = hasBudget && budgetInfo!.limit > 0
        ? Math.min(100, (budgetInfo!.spent / budgetInfo!.limit) * 100)
        : 0;

    return (
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8ecfc] text-[#4863D4]">
                        <CategoryIcon />
                    </span>
                    <div>
                        <h3 className="truncate font-semibold text-slate-900">{cat.name}</h3>
                        <p className="text-xs text-slate-500">
                            {MONTH_NAMES[month - 1]} {year}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0">
                    <button
                        type="button"
                        onClick={onDeleteClick}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete category"
                    >
                        <DeleteIcon />
                    </button>
                </div>
            </div>

            {hasBudget ? (
                <div className="mt-4 space-y-3">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-slate-600">
                            <span className="font-medium tabular-nums text-slate-900">{formatAmount(budgetInfo!.spent)}</span>
                            {" / "}
                            <span className="tabular-nums text-slate-700">{formatAmount(budgetInfo!.limit)}</span>
                        </span>
                        {left >= 0 ? (
                            <span className="font-medium tabular-nums text-[#4863D4]">{formatAmount(left)} left</span>
                        ) : (
                            <span className="font-medium tabular-nums text-red-600">{formatAmount(-left)} over</span>
                        )}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : "bg-[#4863D4]"}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                        />
                    </div>
                </div>
            ) : budgetInfo && budgetInfo.spent > 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                    Spent <span className="tabular-nums font-medium text-slate-700">{formatAmount(budgetInfo.spent)}</span> this month · no budget set
                </p>
            ) : (
                <p className="mt-3 text-sm text-slate-400">No budget or spending yet</p>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onAddBudgetClick}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-[#4863D4] hover:text-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                >
                    {hasBudget ? "Edit budget" : "Add budget"}
                </button>
            </div>
        </article>
    );
}

