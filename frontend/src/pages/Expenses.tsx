import { useState, useRef, useEffect } from "react";
import CashFlowSummaryCard from "../components/shared/CashFlowSummaryCard";
import { useExpenses } from "../hooks/useExpenses";
import { useCategories } from "../hooks/useCategories";
import type { Expense } from "../types";
import type { ExpensePayload, ExpenseFilters } from "../api/expenses";

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
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm";
const btnPrimary =
    "rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50";
const btnSecondary =
    "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2";

export default function Expenses() {
    const { categories } = useCategories();
    const { expenses, loading, error, refetch, addExpense, updateExpense, removeExpense } = useExpenses();

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

    const [duration, setDuration] = useState<"all_time" | "today" | "this_week" | "this_month" | "custom">("all_time");
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");
    const [filterType, setFilterType] = useState<"" | "in" | "out">("");
    const [paymentModeSelected, setPaymentModeSelected] = useState<string[]>([]);
    const [paymentModesOpen, setPaymentModesOpen] = useState(false);
    const [filterCategoryId, setFilterCategoryId] = useState<string>("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [page, setPage] = useState(1);
    const paymentModesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (paymentModesRef.current && !paymentModesRef.current.contains(e.target as Node)) {
                setPaymentModesOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounce search keyword so we refetch after user stops typing
    useEffect(() => {
        const t = setTimeout(() => setDebouncedKeyword(searchKeyword), 400);
        return () => clearTimeout(t);
    }, [searchKeyword]);

    // Auto-apply filters whenever any filter value changes (list and summary update as you type/select)
    const didMount = useRef(false);
    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        setPage(1);
        const range = getDateRange();
        const next: ExpenseFilters = {};
        if (range.start) next.start_date = range.start;
        if (range.end) next.end_date = range.end;
        if (filterType) next.transaction_type = filterType;
        if (paymentModeSelected.length > 0) next.payment_modes = paymentModeSelected.join(",");
        if (filterCategoryId) next.category_id = Number(filterCategoryId);
        if (debouncedKeyword.trim()) next.keyword = debouncedKeyword.trim();
        refetch(next);
    }, [duration, filterStart, filterEnd, filterType, paymentModeSelected, filterCategoryId, debouncedKeyword]);

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

    function getDateRange(): { start?: string; end?: string } {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const d = today.getDate();
        const pad = (n: number) => String(n).padStart(2, "0");
        if (duration === "today") {
            const s = `${y}-${pad(m + 1)}-${pad(d)}`;
            return { start: s, end: s };
        }
        if (duration === "this_week") {
            const day = today.getDay();
            const mon = new Date(today);
            mon.setDate(d - (day === 0 ? 6 : day - 1));
            const sun = new Date(mon);
            sun.setDate(mon.getDate() + 6);
            return {
                start: `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`,
                end: `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`,
            };
        }
        if (duration === "this_month") {
            return {
                start: `${y}-${pad(m + 1)}-01`,
                end: `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`,
            };
        }
        if (duration === "custom" && filterStart && filterEnd) {
            return { start: filterStart, end: filterEnd };
        }
        return {};
    }

    function clearFilters() {
        setPage(1);
        setDuration("all_time");
        setFilterStart("");
        setFilterEnd("");
        setFilterType("");
        setPaymentModeSelected([]);
        setFilterCategoryId("");
        setSearchKeyword("");
        setDebouncedKeyword("");
        setPaymentModesOpen(false);
        refetch();
    }

    const hasActiveFilters =
        duration !== "all_time" ||
        !!filterType ||
        paymentModeSelected.length > 0 ||
        !!filterCategoryId ||
        !!searchKeyword.trim();

    return (
        <div className="space-y-6">
            {/* 1. Page header: title, summary, primary action */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expenses</h1>
                <p className="mt-1 text-sm text-slate-600">
                    {loading ? "…" : expenses.length === 0 ? "No expenses yet" : `${expenses.length} expense${expenses.length === 1 ? "" : "s"}`}
                </p>
            </div>

            {/* Add transaction popup modal (Cash In / Cash Out) */}
            {showAddForm && (
                <div
                    className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/25 p-4"
                    onClick={() => {
                        setShowAddForm(false);
                        setAddError("");
                        setForm(defaultPayload);
                    }}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {showAddForm === "in" ? "Cash In" : "Cash Out"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setAddError("");
                                    setForm(defaultPayload);
                                }}
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                        <form onSubmit={handleAdd} className="p-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Amount *</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={form.amount}
                                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                                        placeholder="0.00"
                                        className={inputClass}
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Date *</span>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                        className={inputClass}
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Category</span>
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
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Payment mode</span>
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
                            </div>
                            <label className="mt-4 block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Notes</span>
                                <input
                                    type="text"
                                    value={form.notes ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    placeholder="Optional"
                                    className={inputClass}
                                />
                            </label>
                            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.is_recurring}
                                    onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                                Recurring
                            </label>
                            {addError && <p className="mt-3 text-sm text-red-600">{addError}</p>}
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setAddError("");
                                        setForm(defaultPayload);
                                    }}
                                    className={btnSecondary}
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={adding} className={btnPrimary}>
                                    {adding ? "Adding…" : "Add"}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Cash In / Cash Out / Net Balance summary (for current filtered list) */}
            {(() => {
                const cashIn = expenses.filter((e) => e.transaction_type === "in").reduce((s, e) => s + Number(e.amount), 0);
                const cashOut = expenses.filter((e) => e.transaction_type === "out").reduce((s, e) => s + Number(e.amount), 0);
                return (
                    <CashFlowSummaryCard cashIn={cashIn} cashOut={cashOut} loading={loading} />
                );
            })()}

            {/* 3. Filters */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value as typeof duration)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        aria-label="Duration"
                    >
                        <option value="all_time">Duration: All Time</option>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="custom">Custom</option>
                    </select>
                    {duration === "custom" && (
                        <>
                            <input
                                type="date"
                                value={filterStart}
                                onChange={(e) => setFilterStart(e.target.value)}
                                className={inputClass + " w-auto min-w-[120px]"}
                                aria-label="From date"
                            />
                            <input
                                type="date"
                                value={filterEnd}
                                onChange={(e) => setFilterEnd(e.target.value)}
                                className={inputClass + " w-auto min-w-[120px]"}
                                aria-label="To date"
                            />
                        </>
                    )}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as "" | "in" | "out")}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        aria-label="Transaction type"
                    >
                        <option value="">Types: All</option>
                        <option value="in">Cash In</option>
                        <option value="out">Cash Out</option>
                    </select>
                    <div className="relative" ref={paymentModesRef}>
                        <button
                            type="button"
                            onClick={() => setPaymentModesOpen((o) => !o)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${
                                paymentModeSelected.length > 0
                                    ? "border-violet-500 bg-violet-50 text-violet-700"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            aria-label="Payment modes"
                            aria-expanded={paymentModesOpen}
                        >
                            Payment Modes{paymentModeSelected.length > 0 ? ` (${paymentModeSelected.length})` : ""}
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {paymentModesOpen && (
                            <div className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                                <div className="border-b border-slate-100 px-2 pb-2">
                                    <input
                                        type="text"
                                        placeholder="Search Payment Modes..."
                                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto py-1">
                                    {PAYMENT_MODES.map((mode) => (
                                        <label
                                            key={mode}
                                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={paymentModeSelected.includes(mode)}
                                                onChange={() =>
                                                    setPaymentModeSelected((prev) =>
                                                        prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                            />
                                            {mode}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <select
                        value={filterCategoryId}
                        onChange={(e) => setFilterCategoryId(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        aria-label="Category"
                    >
                        <option value="">Categories: All</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="Search by remark or amount..."
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 shadow-sm placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            aria-label="Search"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                            /
                        </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddForm("in");
                                setAddError("");
                                setForm({ ...defaultPayload, transaction_type: "in" });
                            }}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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

            {/* 4. Expense list (table with pagination) */}
            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm">
                    Loading…
                </div>
            )}

            {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-700">{error}</p>
                    <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium text-violet-600 hover:underline">
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && expenses.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
                    <p className="text-slate-500">No expenses yet.</p>
                    <p className="mt-1 text-sm text-slate-400">Use &quot;+ Add expense&quot; above to add one, or clear filters.</p>
                </div>
            )}

            {!loading && !error && expenses.length > 0 && (() => {
                const sorted = [...expenses].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id));
                const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
                const currentPage = Math.min(page, totalPages);
                const start = (currentPage - 1) * PAGE_SIZE;
                const pageExpenses = sorted.slice(start, start + PAGE_SIZE);
                const startEntry = start + 1;
                const endEntry = start + pageExpenses.length;
                return (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-600">
                                Showing <span className="font-medium">{startEntry}</span> – <span className="font-medium">{endEntry}</span> of <span className="font-medium">{expenses.length}</span> entries
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
                                                <td colSpan={6} className="bg-violet-50/50 p-0">
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
                    </div>
                );
            })()}

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
                <span className={`font-semibold tabular-nums ${expense.transaction_type === "in" ? "text-emerald-600" : "text-red-600"}`}>
                    {expense.transaction_type === "in" ? "+" : ""}{expense.amount}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-0.5">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600"
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
        <div className="rounded-lg border-2 border-violet-200 bg-violet-50/50 p-4">
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
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Date *</span>
                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                        className={inputClass}
                    />
                </label>
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
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
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
