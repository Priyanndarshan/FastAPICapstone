// Used by: Expenses.tsx for paginated table. Depends on: types (Expense).
import { useMemo } from "react";
import type { Expense } from "../../types";

// Page size for table; used to slice and to compute totalPages
const PAGE_SIZE = 10;

// Sort mode: by date (newest first), or by amount descending/ascending
export type SortOption = "date" | "amount_desc" | "amount_asc";

export function usePaginatedExpenses(
    expenses: Expense[],
    filterRecurring: "" | "true" | "false",
    sortBy: SortOption,
    page: number
) {
    // Apply recurring filter → sort → paginate; return slice + metadata for Expenses table and pagination bar
    return useMemo(() => {
        // Step 1: filter by recurring (all / recurring only / non-recurring only)
        const filtered =
            filterRecurring === "true"
                ? expenses.filter((e) => e.is_recurring)
                : filterRecurring === "false"
                    ? expenses.filter((e) => !e.is_recurring)
                    : expenses;

        // Step 2: sort by amount_desc (high→low), amount_asc (low→high), or date (newest first, then by id)
        const sorted = [...filtered].sort((a, b) => {
            if (sortBy === "amount_desc") {
                return Number(b.amount) - Number(a.amount);
            }
            if (sortBy === "amount_asc") {
                return Number(a.amount) - Number(b.amount);
            }
            return b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id;
        });

        // Step 3: pagination — totalCount from filtered; clamp currentPage; slice for this page; startEntry/endEntry for "Showing X–Y of Z"
        const totalCount = filtered.length;
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const currentPage = Math.min(page, totalPages);
        const start = (currentPage - 1) * PAGE_SIZE;
        const pageExpenses = sorted.slice(start, start + PAGE_SIZE);
        const startEntry = start + 1;
        const endEntry = start + pageExpenses.length;
        const isEmpty = filtered.length === 0;

        // Public API for Expenses: current page slice, page metadata, and empty flag (recurring filter matched nothing)
        return {
            pageExpenses,
            totalPages,
            currentPage,
            totalCount,
            startEntry,
            endEntry,
            isEmpty,
        };
    }, [expenses, filterRecurring, sortBy, page]);
}
