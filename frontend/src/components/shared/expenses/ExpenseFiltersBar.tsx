import { useExpenseFilters } from "../../../hooks/expenses/useExpenseFilters";
import type { Category } from "../../../types";
import { DatePicker } from "../../ui/DatePicker";
import {
    ChevronDownIcon,
    CloseIcon,
    MinusIcon,
    PlusIcon,
    SearchIcon,
    SortIcon,
} from "../../ui/icons";
import { PAYMENT_MODES } from "../../../config/constants";

export type SortOption = "date" | "amount_desc" | "amount_asc";

export interface ExpenseFiltersBarProps {
    filters: ReturnType<typeof useExpenseFilters>;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    categories: Category[];
    onAddCashIn: () => void;
    onAddCashOut: () => void;
}

export default function ExpenseFiltersBar({
    filters,
    sortBy,
    onSortChange,
    categories,
    onAddCashIn,
    onAddCashOut,
}: ExpenseFiltersBarProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-3 border-b border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative" ref={filters.durationDropdownRef}>
                        <button
                            type="button"
                            onClick={() => filters.setDurationDropdownOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.duration !== "all_time"
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            aria-label="Duration"
                            aria-expanded={filters.durationDropdownOpen}
                        >
                            {filters.duration === "all_time" ? "Duration: All Time" : filters.duration === "today" ? "Today" : filters.duration === "this_week" ? "This Week" : filters.duration === "this_month" ? "This Month" : "Custom"}
                            <ChevronDownIcon className="h-4 w-4 shrink-0" />
                        </button>
                        {filters.durationDropdownOpen && (
                            <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[200px] rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                                <div className="px-2 pb-1">
                                    {([
                                        { value: "all_time" as const, label: "All Time" },
                                        { value: "today" as const, label: "Today" },
                                        { value: "this_week" as const, label: "This Week" },
                                        { value: "this_month" as const, label: "This Month" },
                                        { value: "custom" as const, label: "Custom" },
                                    ] as const).map(({ value, label }) => (
                                        <label
                                            key={value}
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${filters.duration === value
                                                ? "bg-[#e8ecfc] text-slate-900"
                                                : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="filterDuration"
                                                checked={filters.duration === value}
                                                onChange={() => { filters.setDuration(value); filters.setDurationDropdownOpen(false); }}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { filters.setDuration("all_time"); filters.setDurationDropdownOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => filters.setDurationDropdownOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {filters.duration === "custom" && (
                        <>
                            <DatePicker
                                value={filters.filterStart}
                                onChange={filters.setFilterStart}
                                placeholder="From date"
                                className="w-auto min-w-[180px]"
                                aria-label="From date"
                            />
                            <DatePicker
                                value={filters.filterEnd}
                                onChange={filters.setFilterEnd}
                                placeholder="To date"
                                className="w-auto min-w-[180px]"
                                aria-label="To date"
                            />
                        </>
                    )}
                    {/* Transaction type: All / Cash In / Cash Out */}
                    <div className="relative" ref={filters.typeFilterRef}>
                        <button
                            type="button"
                            onClick={() => filters.setTypeFilterOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.filterType
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            aria-label="Transaction type"
                            aria-expanded={filters.typeFilterOpen}
                        >
                            {filters.filterType === "in" ? "Cash In" : filters.filterType === "out" ? "Cash Out" : "Types: All"}
                            <ChevronDownIcon className="h-4 w-4 shrink-0" />
                        </button>
                        {filters.typeFilterOpen && (
                            <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[200px] rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                                <div className="px-2 pb-1">
                                    {[
                                        { value: "" as const, label: "All" },
                                        { value: "in" as const, label: "Cash In" },
                                        { value: "out" as const, label: "Cash Out" },
                                    ].map(({ value, label }) => (
                                        <label
                                            key={value || "all"}
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${filters.filterType === value
                                                ? "bg-[#e8ecfc] text-slate-900"
                                                : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="filterType"
                                                checked={filters.filterType === value}
                                                onChange={() => filters.setFilterType(value)}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { filters.setFilterType(""); filters.setTypeFilterOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => filters.setTypeFilterOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Payment modes: multi-select checkboxes from PAYMENT_MODES */}
                    <div className="relative" ref={filters.paymentModesRef}>
                        <button
                            type="button"
                            onClick={() => filters.setPaymentModesOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.paymentModeSelected.length > 0
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            aria-label="Payment modes"
                            aria-expanded={filters.paymentModesOpen}
                        >
                            Payment Modes{filters.paymentModeSelected.length > 0 ? ` (${filters.paymentModeSelected.length})` : ""}
                            <ChevronDownIcon className="h-4 w-4 shrink-0" />
                        </button>
                        {filters.paymentModesOpen && (
                            <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[200px] rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                                <div className="border-b border-slate-100 px-2 pb-2">
                                    <input
                                        type="text"
                                        placeholder="Search Payment Modes..."
                                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm placeholder-slate-400 focus:border-[#4863D4] focus:outline-none"
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto px-2 py-1">
                                    {PAYMENT_MODES.map((mode) => (
                                        <label
                                            key={mode}
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${filters.paymentModeSelected.includes(mode)
                                                ? "bg-[#e8ecfc] text-slate-900"
                                                : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filters.paymentModeSelected.includes(mode)}
                                                onChange={() =>
                                                    filters.setPaymentModeSelected((prev) =>
                                                        prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {mode}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { filters.setPaymentModeSelected([]); filters.setPaymentModesOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => filters.setPaymentModesOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative" ref={filters.categoryFilterRef}>
                        <button
                            type="button"
                            onClick={() => filters.setCategoryFilterOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.filterCategoryId
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            aria-label="Category"
                            aria-expanded={filters.categoryFilterOpen}
                        >
                            {filters.filterCategoryId
                                ? categories.find((c) => String(c.id) === filters.filterCategoryId)?.name ?? "Category"
                                : "Categories: All"}
                            <ChevronDownIcon className="h-4 w-4 shrink-0" />
                        </button>
                        {filters.categoryFilterOpen && (
                            <div className="absolute left-0 top-full z-20 mt-1.5 flex min-w-[200px] max-h-64 flex-col rounded-xl border border-slate-200 bg-white shadow-lg">
                                <div className="overflow-y-auto px-2 py-2">
                                    <label
                                        className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${!filters.filterCategoryId
                                            ? "bg-[#e8ecfc] text-slate-900"
                                            : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="filterCategory"
                                            checked={!filters.filterCategoryId}
                                            onChange={() => filters.setFilterCategoryId("")}
                                            className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                        />
                                        All
                                    </label>
                                    {categories.map((c) => (
                                        <label
                                            key={c.id}
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${filters.filterCategoryId === String(c.id)
                                                ? "bg-[#e8ecfc] text-slate-900"
                                                : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="filterCategory"
                                                checked={filters.filterCategoryId === String(c.id)}
                                                onChange={() => filters.setFilterCategoryId(String(c.id))}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {c.name}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => { filters.setFilterCategoryId(""); filters.setCategoryFilterOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => filters.setCategoryFilterOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Recurring filter: All / Recurring only / Non-recurring only */}
                    <div className="relative" ref={filters.recurringFilterRef}>
                        <button
                            type="button"
                            onClick={() => filters.setRecurringFilterOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.filterRecurring
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            aria-label="Recurring filter"
                            aria-expanded={filters.recurringFilterOpen}
                        >
                            {filters.filterRecurring === "true" ? "Recurring" : filters.filterRecurring === "false" ? "Non-recurring" : "Recurring: All"}
                            <ChevronDownIcon className="h-4 w-4 shrink-0" />
                        </button>
                        {filters.recurringFilterOpen && (
                            <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[200px] rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                                <div className="px-2 pb-1">
                                    {[
                                        { value: "" as const, label: "All" },
                                        { value: "true" as const, label: "Recurring only" },
                                        { value: "false" as const, label: "Non-recurring only" },
                                    ].map(({ value, label }) => (
                                        <label
                                            key={value || "all"}
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${filters.filterRecurring === value
                                                ? "bg-[#e8ecfc] text-slate-900"
                                                : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="filterRecurring"
                                                checked={filters.filterRecurring === value}
                                                onChange={() => { filters.setFilterRecurring(value); filters.setRecurringFilterOpen(false); }}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { filters.setFilterRecurring(""); filters.setRecurringFilterOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => filters.setRecurringFilterOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Clear all filters when any filter is active */}
                    {filters.hasActiveFilters && (
                        <button
                            type="button"
                            onClick={filters.clearFilters}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                        >
                            <CloseIcon />
                            Clear All
                        </button>
                    )}
                </div>
                {/* Search input (debounced in useExpenseFilters) + Sort dropdown + Cash In / Cash Out buttons */}
                <div className="flex flex-wrap items-stretch gap-3">
                    <div className="relative flex min-h-10 min-w-[200px] max-w-md flex-1 items-center">
                        <span className="pointer-events-none absolute left-3 text-slate-400">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            value={filters.searchKeyword}
                            onChange={(e) => filters.setSearchKeyword(e.target.value)}
                            placeholder="Search by remark or amount..."
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 shadow-sm placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                            aria-label="Search"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                            /
                        </span>
                    </div>
                    <div className="relative shrink-0" ref={filters.sortDropdownRef}>
                        <button
                            type="button"
                            onClick={() => filters.setSortDropdownOpen((o) => !o)}
                            className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${sortBy !== "date"
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            aria-label="Sort by"
                            aria-expanded={filters.sortDropdownOpen}
                        >
                            <SortIcon className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="hidden sm:inline">Sort</span>
                            <ChevronDownIcon className="h-4 w-4 shrink-0" />
                        </button>
                        {filters.sortDropdownOpen && (
                            <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[200px] rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                                <div className="px-2 pb-1">
                                    {[
                                        { value: "date" as const, label: "Date (newest first)" },
                                        { value: "amount_desc" as const, label: "Highest to lowest amount" },
                                        { value: "amount_asc" as const, label: "Lowest to highest amount" },
                                    ].map(({ value, label }) => (
                                        <label
                                            key={value}
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${sortBy === value
                                                ? "bg-[#e8ecfc] text-slate-900"
                                                : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                checked={sortBy === value}
                                                onChange={() => { onSortChange(value); filters.setSortDropdownOpen(false); }}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { onSortChange("date"); filters.setSortDropdownOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => filters.setSortDropdownOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={onAddCashIn}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4863D4] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                        >
                            <PlusIcon className="h-5 w-5" aria-hidden />
                            Cash In
                        </button>
                        <button
                            type="button"
                            onClick={onAddCashOut}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <MinusIcon className="h-5 w-5" aria-hidden />
                            Cash Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
