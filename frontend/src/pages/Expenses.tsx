import { useState, useRef, useEffect, useCallback } from "react";
import { CashFlowSummaryCard, ExpenseFormModal } from "../components/shared";
import { DatePicker } from "../components/ui/DatePicker";
import { useExpenses } from "../hooks/useExpenses";
import { useExpenseFilters } from "../hooks/useExpenseFilters";
import { useCategories } from "../hooks/useCategories";
import type { Expense } from "../types";
import type { ExpensePayload, ExpenseFilters } from "../api/expenses";
import { exportExpensesToCSV, exportExpensesToExcel, exportExpensesToPDF } from "../utils/exportExpenses";

const PAYMENT_MODES = ["UPI", "CASH"] as const;

const defaultPayload: ExpensePayload = {
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    is_recurring: false,
    category_id: null,
    payment_mode: "CASH",
    transaction_type: "out",
};

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

function formatDateGroup(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dDay = new Date(d);
    dDay.setHours(0, 0, 0, 0);
    if (dDay.getTime() === today.getTime()) return "Today";
    if (dDay.getTime() === yesterday.getTime()) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const PAGE_SIZE = 10;

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 text-sm";
const btnPrimary =
    "rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2 disabled:opacity-50";
const btnSecondary =
    "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2";

export default function Expenses() {
    const { categories } = useCategories();
    const { expenses, loading, error, refetch, addExpense, updateExpense, removeExpense } = useExpenses();
    const [page, setPage] = useState(1);
    type SortOption = "date" | "amount_desc" | "amount_asc";
    const [sortBy, setSortBy] = useState<SortOption>("date");
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const onFilterChange = useCallback(
        (filters: ExpenseFilters) => {
            setPage(1);
            refetch(filters);
        },
        [refetch]
    );
    const filters = useExpenseFilters(onFilterChange);

    const [typeFilterOpen, setTypeFilterOpen] = useState(false);
    const typeFilterRef = useRef<HTMLDivElement>(null);
    const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
    const durationDropdownRef = useRef<HTMLDivElement>(null);
    const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
    const categoryFilterRef = useRef<HTMLDivElement>(null);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);
    const [recurringFilterOpen, setRecurringFilterOpen] = useState(false);
    const recurringFilterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (filters.paymentModesRef.current && !filters.paymentModesRef.current.contains(target)) {
                filters.setPaymentModesOpen(false);
            }
            if (typeFilterRef.current && !typeFilterRef.current.contains(target)) {
                setTypeFilterOpen(false);
            }
            if (durationDropdownRef.current && !durationDropdownRef.current.contains(target)) {
                setDurationDropdownOpen(false);
            }
            if (categoryFilterRef.current && !categoryFilterRef.current.contains(target)) {
                setCategoryFilterOpen(false);
            }
            if (recurringFilterRef.current && !recurringFilterRef.current.contains(target)) {
                setRecurringFilterOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
                setSortDropdownOpen(false);
            }
            if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
                setExportMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [filters.setPaymentModesOpen]);

    const [showAddForm, setShowAddForm] = useState<"in" | "out" | false>(false);
    const [form, setForm] = useState<ExpensePayload>(defaultPayload);
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");

    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<ExpensePayload>(defaultPayload);
    const [editError, setEditError] = useState("");
    const [saving, setSaving] = useState(false);

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

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

    function startEdit(exp: Expense) {
        setEditId(exp.id);
        setEditForm(payloadFromExpense(exp));
        setEditError("");
    }

    function cancelEdit() {
        setEditId(null);
        setEditForm(defaultPayload);
        setEditError("");
    }

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

    async function handleDelete(id: number) {
        setDeleting(true);
        try {
            await removeExpense(id);
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* 1. Page header: title, summary, Export */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expenses</h1>
                </div>
                <div className="relative shrink-0 sm:ml-auto" ref={exportMenuRef}>
                    <button
                        type="button"
                        onClick={() => setExportMenuOpen((o) => !o)}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                        aria-expanded={exportMenuOpen}
                        aria-haspopup="true"
                    >
                        Export
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <svg className={`h-4 w-4 transition-transform ${exportMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
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
            </div>

            {/* Add transaction modal (Cash In / Cash Out) */}
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

            {/* Cash In / Cash Out / Net Balance summary (for current filtered list) */}
            {(() => {
                const cashIn = expenses.filter((e) => e.transaction_type === "in").reduce((s, e) => s + Number(e.amount), 0);
                const cashOut = expenses.filter((e) => e.transaction_type === "out").reduce((s, e) => s + Number(e.amount), 0);
                return (
                    <CashFlowSummaryCard cashIn={cashIn} cashOut={cashOut} loading={loading} />
                );
            })()}

            {/* 3. Filters + Table: single card */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="space-y-3 border-b border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                    <div className="relative" ref={durationDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDurationDropdownOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.duration !== "all_time"
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            aria-label="Duration"
                            aria-expanded={durationDropdownOpen}
                        >
                            {filters.duration === "all_time" ? "Duration: All Time" : filters.duration === "today" ? "Today" : filters.duration === "this_week" ? "This Week" : filters.duration === "this_month" ? "This Month" : "Custom"}
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {durationDropdownOpen && (
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
                                                onChange={() => { filters.setDuration(value); setDurationDropdownOpen(false); }}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { filters.setDuration("all_time"); setDurationDropdownOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDurationDropdownOpen(false)}
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
                    <div className="relative" ref={typeFilterRef}>
                        <button
                            type="button"
                            onClick={() => setTypeFilterOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.filterType
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            aria-label="Transaction type"
                            aria-expanded={typeFilterOpen}
                        >
                            {filters.filterType === "in" ? "Cash In" : filters.filterType === "out" ? "Cash Out" : "Types: All"}
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {typeFilterOpen && (
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
                                        onClick={() => { filters.setFilterType(""); setTypeFilterOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTypeFilterOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
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
                    <div className="relative" ref={categoryFilterRef}>
                        <button
                            type="button"
                            onClick={() => setCategoryFilterOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.filterCategoryId
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            aria-label="Category"
                            aria-expanded={categoryFilterOpen}
                        >
                            {filters.filterCategoryId
                                ? categories.find((c) => String(c.id) === filters.filterCategoryId)?.name ?? "Category"
                                : "Categories: All"}
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {categoryFilterOpen && (
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
                                        onClick={() => { filters.setFilterCategoryId(""); setCategoryFilterOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCategoryFilterOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative" ref={recurringFilterRef}>
                        <button
                            type="button"
                            onClick={() => setRecurringFilterOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${filters.filterRecurring
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            aria-label="Recurring filter"
                            aria-expanded={recurringFilterOpen}
                        >
                            {filters.filterRecurring === "true" ? "Recurring" : filters.filterRecurring === "false" ? "Non-recurring" : "Recurring: All"}
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {recurringFilterOpen && (
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
                                                onChange={() => { filters.setFilterRecurring(value); setRecurringFilterOpen(false); }}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { filters.setFilterRecurring(""); setRecurringFilterOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRecurringFilterOpen(false)}
                                        className="text-sm font-medium text-[#4863D4] hover:text-[#3a50b8]"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {filters.hasActiveFilters && (
                        <button
                            type="button"
                            onClick={filters.clearFilters}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear All
                        </button>
                    )}
                    </div>
                    <div className="flex flex-wrap items-stretch gap-3">
                    <div className="relative flex min-h-10 min-w-[200px] max-w-md flex-1 items-center">
                        <span className="pointer-events-none absolute left-3 text-slate-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
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
                    <div className="relative shrink-0" ref={sortDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setSortDropdownOpen((o) => !o)}
                            className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 ${sortBy !== "date"
                                ? "border-[#4863D4] bg-[#e8ecfc] text-[#3a50b8]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            aria-label="Sort by"
                            aria-expanded={sortDropdownOpen}
                        >
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            <span className="hidden sm:inline">Sort</span>
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {sortDropdownOpen && (
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
                                                onChange={() => { setSortBy(value); setPage(1); setSortDropdownOpen(false); }}
                                                className="h-4 w-4 border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setSortBy("date"); setPage(1); setSortDropdownOpen(false); }}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSortDropdownOpen(false)}
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
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
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
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                            Cash Out
                        </button>
                    </div>
                    </div>
                </div>

                {/* 4. Expense list (table with pagination) - same card */}
                {loading && (
                    <div className="py-12 text-center text-slate-500">
                        Loading…
                    </div>
                )}

                {!loading && error && (
                    <div className="border-t border-slate-200 bg-red-50/50 p-6 text-center">
                        <p className="text-red-700">{error}</p>
                        <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium text-[#4863D4] hover:underline">
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && expenses.length === 0 && (
                    <div className="border-t border-slate-200 py-16 text-center">
                        <p className="text-slate-500">No expenses yet.</p>
                        <p className="mt-1 text-sm text-slate-400">Use &quot;Cash In&quot; or &quot;Cash Out&quot; above to add one, or clear filters.</p>
                    </div>
                )}

                {!loading && !error && expenses.length > 0 && (() => {
                    const filteredByRecurring = filters.filterRecurring === "true"
                        ? expenses.filter((e) => e.is_recurring)
                        : filters.filterRecurring === "false"
                            ? expenses.filter((e) => !e.is_recurring)
                            : expenses;
                    if (filteredByRecurring.length === 0) {
                        return (
                            <div className="border-t border-slate-200 py-12 text-center">
                                <p className="text-slate-500">No expenses match the recurring filter.</p>
                                <p className="mt-1 text-sm text-slate-400">Try changing or clearing filters.</p>
                            </div>
                        );
                    }
                    const sorted = [...filteredByRecurring].sort((a, b) => {
                        if (sortBy === "amount_desc") {
                            const amtA = Number(a.amount);
                            const amtB = Number(b.amount);
                            return amtB - amtA;
                        }
                        if (sortBy === "amount_asc") {
                            const amtA = Number(a.amount);
                            const amtB = Number(b.amount);
                            return amtA - amtB;
                        }
                        return b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id;
                    });
                    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
                    const currentPage = Math.min(page, totalPages);
                    const start = (currentPage - 1) * PAGE_SIZE;
                    const pageExpenses = sorted.slice(start, start + PAGE_SIZE);
                    const startEntry = start + 1;
                    const endEntry = start + pageExpenses.length;
                    return (
                        <>
                        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-600">
                                Showing <span className="font-medium">{startEntry}</span> – <span className="font-medium">{endEntry}</span> of <span className="font-medium">{filteredByRecurring.length}</span> entries
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                                    aria-label="Previous page"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="flex items-center gap-1 text-sm text-slate-700">
                                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                                    aria-label="Next page"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
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
                                    {pageExpenses.map((exp) => (
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
                    );
                })()}
            </div>

            {/* Delete modal */}
            {deleteId !== null && (
                <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/25 p-4">
                    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                        <p className="text-slate-700">Delete this expense? This cannot be undone.</p>
                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setDeleteId(null)} className={btnSecondary + " flex-1"}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

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
    const categoryName = expense.category_id
        ? categories.find((c) => c.id === expense.category_id)?.name ?? `#${expense.category_id}`
        : "—";
    return (
        <tr className="transition-colors hover:bg-slate-50/80">
            <td className="px-4 py-3 text-slate-700">{formatDateGroup(expense.date)}</td>
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
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}

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
                        className={inputClass}
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
                        className={inputClass}
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
                        className={inputClass}
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
                        className={inputClass}
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
                        className={inputClass}
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
