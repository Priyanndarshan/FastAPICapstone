// Page deps: shared components, DatePicker, icons, useExpenses/useExpenseFilters/useCategories/usePaginatedExpenses, types, export utils, formatters, config, styles
import { useState, useRef, useCallback } from "react";
import { CashFlowSummaryCard, ConfirmModal, ExpenseFormModal, PageHeader } from "../components/shared";
import { DatePicker } from "../components/ui/DatePicker";
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CloseIcon,
    DeleteIcon,
    DownloadIcon,
    EditIcon,
    MinusIcon,
    PlusIcon,
    SearchIcon,
    SortIcon,
} from "../components/ui/icons";
import { useExpenses } from "../hooks/useExpenses";
import { useExpenseFilters } from "../hooks/useExpenseFilters";
import { usePaginatedExpenses, type SortOption } from "../hooks/usePaginatedExpenses";
import { useCategories } from "../hooks/useCategories";
import type { Expense } from "../types";
import type { ExpensePayload, ExpenseFilters } from "../api/expenses";
import { exportExpensesToCSV, exportExpensesToExcel, exportExpensesToPDF } from "../utils/exportExpenses";
import { formatDateLabel } from "../utils/formatters";
import { PAYMENT_MODES } from "../config/constants";
import { input, btnPrimary, btnSecondary } from "../styles/ui";

// Default form values for add/edit; date is today in YYYY-MM-DD
const defaultPayload: ExpensePayload = {
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    is_recurring: false,
    category_id: null,
    payment_mode: "CASH",
    transaction_type: "out",
};

// Converts an Expense from API into form payload for editing
function payloadFromExpense(e: Expense): ExpensePayload {
    return {
        amount: e.amount,
        payment_mode: e.payment_mode,
        transaction_type: e.transaction_type,
        date: e.date,
        notes: e.notes ?? "",
        is_recurring: e.is_recurring,
        recurrence_period: e.recurrence_period ?? null,
        category_id: e.category_id,
    };
}

export default function Expenses() {
    // Data: categories for dropdowns; expenses list + CRUD + loading/error from useExpenses; pagination and sort; export menu open state + ref
    const { categories } = useCategories();
    const { expenses, loading, error, refetch, addExpense, updateExpense, removeExpense } = useExpenses();
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>("date");
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // When filters change, reset to page 1 and refetch expenses with new filters
    const onFilterChange = useCallback(
        (filters: ExpenseFilters) => {
            setPage(1);
            refetch(filters);
        },
        [refetch]
    );
    const filters = useExpenseFilters(onFilterChange, { exportMenuRef, setExportMenuOpen });

    // Pagination: recurring filter + sort + slice for current page (from usePaginatedExpenses)
    const paginated = usePaginatedExpenses(expenses, filters.filterRecurring, sortBy, page);

    // Summary totals from current filtered expenses
    const cashIn = expenses.filter((e) => e.transaction_type === "in").reduce((s, e) => s + Number(e.amount), 0);
    const cashOut = expenses.filter((e) => e.transaction_type === "out").reduce((s, e) => s + Number(e.amount), 0);

    // Add-expense modal: "in" | "out" | false; form state, adding flag, validation error
    const [showAddForm, setShowAddForm] = useState<"in" | "out" | false>(false);
    const [form, setForm] = useState<ExpensePayload>(defaultPayload);
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");

    // Edit inline: which expense id is being edited, form state, error, saving flag
    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<ExpensePayload>(defaultPayload);
    const [editError, setEditError] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete confirmation: which expense id; deleting = request in progress
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Submit add form: validate amount, call addExpense, reset form and close modal on success
    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        const amount = form.amount.trim();
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setAddError("Enter a valid amount.");
            return;
        }
        setAdding(true);
        setAddError("");
        try {
            await addExpense({
                ...form,
                amount,
                category_id: form.category_id ?? null,
                payment_mode: form.payment_mode ?? "CASH",
                transaction_type: form.transaction_type ?? "out",
                notes: form.notes || null,
                recurrence_period: form.is_recurring ? form.recurrence_period ?? null : null,
            });
            setForm(defaultPayload);
            setShowAddForm(false);
        } catch (err) {
            setAddError((err as Error).message);
        } finally {
            setAdding(false);
        }
    }

    // Open inline edit for an expense; fill form from payloadFromExpense(exp)
    function startEdit(exp: Expense) {
        setEditId(exp.id);
        setEditForm(payloadFromExpense(exp));
        setEditError("");
    }

    // Close edit row and reset edit form
    function cancelEdit() {
        setEditId(null);
        setEditForm(defaultPayload);
        setEditError("");
    }

    // Submit edit form: validate amount, call updateExpense, then cancelEdit on success
    async function handleSaveEdit(id: number) {
        const amount = editForm.amount.trim();
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setEditError("Enter a valid amount.");
            return;
        }
        setSaving(true);
        setEditError("");
        try {
            await updateExpense(id, {
                ...editForm,
                amount,
                category_id: editForm.category_id ?? null,
                payment_mode: editForm.payment_mode ?? "CASH",
                transaction_type: editForm.transaction_type ?? "out",
                notes: editForm.notes || null,
                recurrence_period: editForm.is_recurring ? editForm.recurrence_period ?? null : null,
            });
            cancelEdit();
        } catch (err) {
            setEditError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    // Confirm delete: call removeExpense, then clear deleteId to close ConfirmModal
    async function handleDelete(id: number) {
        setDeleting(true);
        try {
            await removeExpense(id);
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    }

    // Layout: header with Export dropdown, add modal, summary card, filters + table (or loading/error/empty), delete modal
    return (
        <div className="space-y-6">
            {/* Title and Export dropdown (CSV, Excel, PDF) */}
            <PageHeader
                title="Expenses"
                actions={
                    <div className="relative shrink-0" ref={exportMenuRef}>
                        <button
                            type="button"
                            onClick={() => setExportMenuOpen((o) => !o)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                            aria-expanded={exportMenuOpen}
                            aria-haspopup="true"
                        >
                            Export
                            <DownloadIcon />
                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${exportMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                        {exportMenuOpen && (
                            <div className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                <button
                                    type="button"
                                    onClick={() => {
                                        exportExpensesToCSV(expenses, categories);
                                        setExportMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <span className="text-slate-500">.csv</span>
                                    Download as CSV
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        exportExpensesToExcel(expenses, categories);
                                        setExportMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <span className="text-slate-500">.xlsx</span>
                                    Download as Excel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        exportExpensesToPDF(expenses, categories);
                                        setExportMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <span className="text-slate-500">.pdf</span>
                                    Download as PDF
                                </button>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Add Cash In / Cash Out modal; form state and submit go through handleAdd */}
            {showAddForm && (
                <ExpenseFormModal
                    title={showAddForm === "in" ? "Cash In" : "Cash Out"}
                    form={form}
                    onChange={setForm}
                    categories={categories}
                    error={addError}
                    submitting={adding}
                    submitLabel={adding ? "Adding…" : "Add"}
                    onSubmit={handleAdd}
                    onClose={() => {
                        setShowAddForm(false);
                        setAddError("");
                        setForm(defaultPayload);
                    }}
                />
            )}

            {/* Summary: sum of cash in / cash out from current filtered expenses */}
            <CashFlowSummaryCard cashIn={cashIn} cashOut={cashOut} loading={loading} />

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                                filters.duration === value
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
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                                filters.filterType === value
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
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                                filters.paymentModeSelected.includes(mode)
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
                                        className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                            !filters.filterCategoryId
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
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                                filters.filterCategoryId === String(c.id)
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
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                                filters.filterRecurring === value
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
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                                sortBy === value
                                                    ? "bg-[#e8ecfc] text-slate-900"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                checked={sortBy === value}
                                                onChange={() => { setSortBy(value); setPage(1); filters.setSortDropdownOpen(false); }}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setSortBy("date"); setPage(1); filters.setSortDropdownOpen(false); }}
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
                            onClick={() => {
                                setShowAddForm("in");
                                setAddError("");
                                setForm({ ...defaultPayload, transaction_type: "in" });
                            }}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4863D4] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                        >
                            <PlusIcon className="h-5 w-5" aria-hidden />
                            Cash In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddForm("out");
                                setAddError("");
                                setForm({ ...defaultPayload, transaction_type: "out" });
                            }}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <MinusIcon className="h-5 w-5" aria-hidden />
                            Cash Out
                        </button>
                    </div>
                    </div>
                </div>

                {/* Loading state while useExpenses is fetching */}
                {loading && (
                    <div className="py-12 text-center text-slate-500">
                        Loading…
                    </div>
                )}

                {/* Error state; "Try again" triggers refetch with current filters */}
                {!loading && error && (
                    <div className="border-t border-slate-200 bg-red-50/50 p-6 text-center">
                        <p className="text-red-700">{error}</p>
                        <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium text-[#4863D4] hover:underline">
                            Try again
                        </button>
                    </div>
                )}

                {/* Empty state when no expenses match filters */}
                {!loading && !error && expenses.length === 0 && (
                    <div className="border-t border-slate-200 py-16 text-center">
                        <p className="text-slate-500">No expenses yet.</p>
                        <p className="mt-1 text-sm text-slate-400">Use &quot;Cash In&quot; or &quot;Cash Out&quot; above to add one, or clear filters.</p>
                    </div>
                )}

                {/* Recurring filter leaves no results */}
                {!loading && !error && expenses.length > 0 && paginated.isEmpty && (
                    <div className="border-t border-slate-200 py-12 text-center">
                        <p className="text-slate-500">No expenses match the recurring filter.</p>
                        <p className="mt-1 text-sm text-slate-400">Try changing or clearing filters.</p>
                    </div>
                )}

                {/* Pagination + table when there are expenses after recurring filter */}
                {!loading && !error && expenses.length > 0 && !paginated.isEmpty && (
                    <>
                        {/* Pagination: "Showing X – Y of Z" + prev/next buttons */}
                        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-600">
                                Showing <span className="font-medium">{paginated.startEntry}</span> – <span className="font-medium">{paginated.endEntry}</span> of <span className="font-medium">{paginated.totalCount}</span> entries
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={paginated.currentPage <= 1}
                                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                <span className="flex items-center gap-1 text-sm text-slate-700">
                                    Page <span className="font-medium">{paginated.currentPage}</span> of <span className="font-medium">{paginated.totalPages}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(paginated.totalPages, p + 1))}
                                    disabled={paginated.currentPage >= paginated.totalPages}
                                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                                    aria-label="Next page"
                                >
                                    <ChevronRightIcon />
                                </button>
                            </div>
                        </div>
                        {/* Table: each row is either ExpenseTableRow or inline ExpenseEditForm when editId matches */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Mode</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="w-24 px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginated.pageExpenses.map((exp) => (
                                        editId === exp.id ? (
                                            <tr key={exp.id}>
                                                <td colSpan={6} className="bg-[#e8ecfc]/50 p-0">
                                                    <ExpenseEditForm
                                                        form={editForm}
                                                        setForm={setEditForm}
                                                        categories={categories}
                                                        error={editError}
                                                        saving={saving}
                                                        onSave={() => handleSaveEdit(exp.id)}
                                                        onCancel={cancelEdit}
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            <ExpenseTableRow
                                                key={exp.id}
                                                expense={exp}
                                                categories={categories}
                                                onEdit={() => startEdit(exp)}
                                                onDelete={() => setDeleteId(exp.id)}
                                            />
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Delete confirmation modal; confirm runs handleDelete(deleteId), cancel clears deleteId */}
            {deleteId !== null && (
                <ConfirmModal
                    message="Delete this expense? This cannot be undone."
                    confirmLabel={deleting ? "Deleting…" : "Delete"}
                    cancelLabel="Cancel"
                    loading={deleting}
                    onConfirm={() => handleDelete(deleteId)}
                    onCancel={() => setDeleteId(null)}
                />
            )}
        </div>
    );
}

// One table row: date, notes (+ recurring badge), category, payment mode, amount, edit/delete buttons
function ExpenseTableRow({
    expense,
    categories,
    onEdit,
    onDelete,
}: {
    expense: Expense;
    categories: { id: number; name: string }[];
    onEdit: () => void;
    onDelete: () => void;
}) {
    // Resolve category id to name for display
    const categoryName = expense.category_id
        ? categories.find((c) => c.id === expense.category_id)?.name ?? `#${expense.category_id}`
        : "—";
    return (
        <tr className="transition-colors hover:bg-slate-50/80">
            <td className="px-4 py-3 text-slate-700">{formatDateLabel(expense.date)}</td>
            <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    {expense.notes ? (
                        <span className="text-slate-800" title={expense.notes}>{expense.notes}</span>
                    ) : (
                        <span className="text-slate-400">—</span>
                    )}
                    {expense.is_recurring && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Recurring</span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 text-slate-600">{categoryName}</td>
            <td className="px-4 py-3 text-slate-600">{expense.payment_mode}</td>
            <td className="px-4 py-3 text-right">
                <span className={`font-semibold tabular-nums ${expense.transaction_type === "in" ? "text-[#4863D4]" : "text-red-600"}`}>
                    {expense.transaction_type === "in" ? "+" : ""}{expense.amount}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-0.5">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded p-1.5 text-slate-400 hover:bg-[#e8ecfc] hover:text-[#4863D4]"
                        aria-label="Edit"
                    >
                        <EditIcon />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                    >
                        <DeleteIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// Inline edit form: amount, date, category, payment mode, type, notes, recurring; Save calls onSave, Cancel calls onCancel
function ExpenseEditForm({
    form,
    setForm,
    categories,
    error,
    saving,
    onSave,
    onCancel,
}: {
    form: ExpensePayload;
    setForm: React.Dispatch<React.SetStateAction<ExpensePayload>>;
    categories: { id: number; name: string }[];
    error: string;
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="rounded-lg border-2 border-[#4863D4]/30 bg-[#e8ecfc]/50 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Amount *</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        className={input}
                    />
                </label>
                <div className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Date *</span>
                    <DatePicker
                        value={form.date}
                        onChange={(value) => setForm((f) => ({ ...f, date: value }))}
                        placeholder="Pick a date"
                        className="w-full"
                    />
                </div>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Category</span>
                    <select
                        value={form.category_id ?? ""}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                category_id: e.target.value ? Number(e.target.value) : null,
                            }))
                        }
                        className={input}
                    >
                        <option value="">None</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Payment mode</span>
                    <select
                        value={form.payment_mode ?? "CASH"}
                        onChange={(e) => setForm((f) => ({ ...f, payment_mode: e.target.value }))}
                        className={input}
                    >
                        {PAYMENT_MODES.map((mode) => (
                            <option key={mode} value={mode}>{mode}</option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Type</span>
                    <select
                        value={form.transaction_type ?? "out"}
                        onChange={(e) => setForm((f) => ({ ...f, transaction_type: e.target.value as "in" | "out" }))}
                        className={input}
                    >
                        <option value="out">Cash Out</option>
                        <option value="in">Cash In</option>
                    </select>
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Notes</span>
                    <input
                        type="text"
                        value={form.notes ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        className={input}
                    />
                </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                />
                Recurring
            </label>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
                <button type="button" onClick={onSave} disabled={saving} className={btnPrimary}>
                    {saving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={onCancel} className={btnSecondary}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
