import { useState, useMemo } from "react";
import { useCategories } from "../hooks/useCategories";
import { useBudgets } from "../hooks/useBudgets";
import { useAnalytics } from "../hooks/useAnalytics";
import type { Category } from "../types";
import { MONTH_NAMES } from "../config/constants";
import { formatAmount } from "../utils/formatters";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

export default function Categories() {
    const { categories, loading, error, refetch, addCategory, updateCategory, removeCategory } =
        useCategories();
    const { budgets, addBudget, updateBudget } = useBudgets();
    const { monthly } = useAnalytics(currentMonth, currentYear, 1);

    const budgetByCategory = useMemo(() => {
        const map: Record<number, { limit: number; spent: number }> = {};
        const thisMonthBudgets = budgets.filter(
            (b) => b.month === currentMonth && b.year === currentYear
        );
        for (const b of thisMonthBudgets) {
            map[b.category_id] = { limit: Number(b.limit_amount), spent: 0 };
        }
        for (const c of monthly?.categories ?? []) {
            if (c.category_id != null) {
                const spent = Number(c.total_amount);
                if (map[c.category_id]) {
                    map[c.category_id].spent = spent;
                } else {
                    map[c.category_id] = { limit: 0, spent };
                }
            }
        }
        return map;
    }, [budgets, monthly]);

    // Add category modal (with optional budget)
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addModalName, setAddModalName] = useState("");
    const [addModalAmount, setAddModalAmount] = useState("");
    const [addModalMonth, setAddModalMonth] = useState(currentMonth);
    const [addModalYear, setAddModalYear] = useState(currentYear);
    const [addModalError, setAddModalError] = useState("");
    const [addModalSaving, setAddModalSaving] = useState(false);

    // Delete state
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Add/Edit budget modal (per category; also edit category name here)
    const [budgetFormCategoryId, setBudgetFormCategoryId] = useState<number | null>(null);
    const [budgetFormName, setBudgetFormName] = useState("");
    const [budgetFormMonth, setBudgetFormMonth] = useState(currentMonth);
    const [budgetFormYear, setBudgetFormYear] = useState(currentYear);
    const [budgetFormAmount, setBudgetFormAmount] = useState("");
    const [budgetFormError, setBudgetFormError] = useState("");
    const [budgetFormSaving, setBudgetFormSaving] = useState(false);

    function openAddModal() {
        setAddModalName("");
        setAddModalAmount("");
        setAddModalMonth(currentMonth);
        setAddModalYear(currentYear);
        setAddModalError("");
        setAddModalOpen(true);
    }

    function closeAddModal() {
        setAddModalOpen(false);
        setAddModalName("");
        setAddModalAmount("");
        setAddModalError("");
    }

    async function handleAddCategoryWithBudget(e: React.FormEvent) {
        e.preventDefault();
        const name = addModalName.trim();
        if (!name) {
            setAddModalError("Category name is required.");
            return;
        }
        const amountStr = addModalAmount.trim();
        const amountNum = amountStr ? parseFloat(amountStr) : 0;
        if (amountStr && (isNaN(amountNum) || amountNum <= 0)) {
            setAddModalError("Enter a valid budget amount.");
            return;
        }
        setAddModalSaving(true);
        setAddModalError("");
        try {
            const cat = await addCategory(name);
            if (amountStr && !isNaN(amountNum) && amountNum > 0) {
                await addBudget({
                    category_id: cat.id,
                    month: addModalMonth,
                    year: addModalYear,
                    limit_amount: amountStr,
                });
            }
            closeAddModal();
        } catch (err) {
            setAddModalError((err as Error).message);
        } finally {
            setAddModalSaving(false);
        }
    }

    async function handleDelete(id: number) {
        setDeleting(true);
        try {
            await removeCategory(id);
            setDeleteId(null);
        } catch {
            // keep modal open on error
        } finally {
            setDeleting(false);
        }
    }

    function openBudgetForm(categoryId: number) {
        const cat = categories.find((c) => c.id === categoryId);
        const existing = budgets.find(
            (b) => b.category_id === categoryId && b.month === currentMonth && b.year === currentYear
        );
        setBudgetFormCategoryId(categoryId);
        setBudgetFormName(cat?.name ?? "");
        setBudgetFormMonth(currentMonth);
        setBudgetFormYear(currentYear);
        setBudgetFormAmount(existing ? existing.limit_amount : "");
        setBudgetFormError("");
    }

    function closeBudgetForm() {
        setBudgetFormCategoryId(null);
        setBudgetFormName("");
        setBudgetFormAmount("");
        setBudgetFormError("");
    }

    async function handleSaveBudget(e: React.FormEvent) {
        e.preventDefault();
        if (budgetFormCategoryId == null) return;
        const name = budgetFormName.trim();
        if (!name) {
            setBudgetFormError("Category name is required.");
            return;
        }
        const amount = budgetFormAmount.trim();
        const num = parseFloat(amount);
        if (!amount || isNaN(num) || num <= 0) {
            setBudgetFormError("Enter a valid amount.");
            return;
        }
        setBudgetFormSaving(true);
        setBudgetFormError("");
        try {
            const cat = categories.find((c) => c.id === budgetFormCategoryId);
            if (cat && name !== cat.name) {
                await updateCategory(budgetFormCategoryId, name);
            }
            const existing = budgets.find(
                (b) =>
                    b.category_id === budgetFormCategoryId &&
                    b.month === budgetFormMonth &&
                    b.year === budgetFormYear
            );
            if (existing) {
                await updateBudget(existing.id, { limit_amount: amount });
            } else {
                await addBudget({
                    category_id: budgetFormCategoryId,
                    month: budgetFormMonth,
                    year: budgetFormYear,
                    limit_amount: amount,
                });
            }
            closeBudgetForm();
        } catch (err) {
            setBudgetFormError((err as Error).message);
        } finally {
            setBudgetFormSaving(false);
        }
    }

    const btnSecondary =
        "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2";

    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
                    <p className="mt-0.5 text-sm text-slate-500">Organize expenses and set budgets by category</p>
                </div>
                <div className="flex items-center gap-3">
                    {!loading && !error && categories.length > 0 && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                            {categories.length} {categories.length === 1 ? "category" : "categories"}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4863D4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add category
                    </button>
                </div>
            </header>

            {/* Category / budget cards — no outer card */}
            {loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Loading…
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <p className="text-red-700">{error}</p>
                    <button type="button" onClick={refetch} className="mt-3 text-sm font-medium text-[#4863D4] hover:underline">
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && categories.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 px-6 text-center">
                    <p className="text-slate-600">No categories yet</p>
                    <p className="mt-1 text-sm text-slate-500">Click &quot;Add category&quot; above to create one and optionally set a budget.</p>
                </div>
            )}

            {!loading && !error && categories.length > 0 && (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((cat) => (
                        <li key={cat.id}>
                            <CategoryRow
                                cat={cat}
                                budgetInfo={budgetByCategory[cat.id]}
                                month={currentMonth}
                                year={currentYear}
                                onDeleteClick={() => setDeleteId(cat.id)}
                                onAddBudgetClick={() => openBudgetForm(cat.id)}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {/* Add/Edit budget modal */}
            {budgetFormCategoryId !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
                    onClick={closeBudgetForm}
                >
                    <div
                        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-slate-900">
                            {budgets.some(
                                (b) =>
                                    b.category_id === budgetFormCategoryId &&
                                    b.month === budgetFormMonth &&
                                    b.year === budgetFormYear
                            )
                                ? "Edit budget"
                                : "Add budget"}
                        </h3>
                        <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Category name</span>
                                <input
                                    type="text"
                                    value={budgetFormName}
                                    onChange={(e) => setBudgetFormName(e.target.value)}
                                    placeholder="e.g. Fitness, Groceries"
                                    maxLength={100}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Month</span>
                                    <select
                                        value={budgetFormMonth}
                                        onChange={(e) => setBudgetFormMonth(Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                    >
                                        {MONTH_NAMES.map((name, i) => (
                                            <option key={name} value={i + 1}>{name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Year</span>
                                    <select
                                        value={budgetFormYear}
                                        onChange={(e) => setBudgetFormYear(Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                    >
                                        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Amount</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={budgetFormAmount}
                                    onChange={(e) => setBudgetFormAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                />
                            </label>
                            {budgetFormError && (
                                <p className="text-sm text-red-600">{budgetFormError}</p>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeBudgetForm}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={budgetFormSaving || !budgetFormName.trim() || !budgetFormAmount.trim()}
                                    className="rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a50b8] disabled:opacity-50"
                                >
                                    {budgetFormSaving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add category (with optional budget) modal */}
            {addModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
                    onClick={closeAddModal}
                >
                    <div
                        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-slate-900">Add category</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Create a category and optionally set a budget.</p>
                        <form onSubmit={handleAddCategoryWithBudget} className="mt-4 space-y-4">
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Category name</span>
                                <input
                                    type="text"
                                    value={addModalName}
                                    onChange={(e) => setAddModalName(e.target.value)}
                                    placeholder="e.g. Groceries, Transport, Fitness"
                                    maxLength={100}
                                    autoFocus
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Budget amount (optional)</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={addModalAmount}
                                    onChange={(e) => setAddModalAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Month</span>
                                    <select
                                        value={addModalMonth}
                                        onChange={(e) => setAddModalMonth(Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                    >
                                        {MONTH_NAMES.map((name, i) => (
                                            <option key={name} value={i + 1}>{name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Year</span>
                                    <select
                                        value={addModalYear}
                                        onChange={(e) => setAddModalYear(Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                    >
                                        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            {addModalError && (
                                <p className="text-sm text-red-600">{addModalError}</p>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeAddModal}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addModalSaving || !addModalName.trim()}
                                    className="rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a50b8] disabled:opacity-50"
                                >
                                    {addModalSaving ? "Adding…" : "Add category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirm modal */}
            {deleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                        <p className="text-slate-700">
                            Delete &quot;{categories.find((c) => c.id === deleteId)?.name}&quot;? Expenses may lose their category.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className={btnSecondary + " flex-1"}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
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

// --- CategoryRow ---

interface BudgetInfo {
    limit: number;
    spent: number;
}

interface CategoryRowProps {
    cat: Category;
    budgetInfo?: BudgetInfo;
    month: number;
    year: number;
    onDeleteClick: () => void;
    onAddBudgetClick: () => void;
}

function CategoryRow({
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
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
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
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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